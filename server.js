require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use(express.static(__dirname, { index: 'index.html' }));


function cleanText(value, max = 1000) {
  return String(value ?? '').trim().slice(0, max);
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Sin conexión a MySQL.' });
  }
});

app.get('/api/projects', async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT id, name AS nombre, creator AS desarrolladoPor,
           progress_percent AS avance, stage AS etapa,
           requirements AS requerimientos, image_url AS imagen
    FROM projects
    ORDER BY id ASC
  `);
  res.json(rows);
});

app.get('/api/projects/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'ID inválido.' });

  const [projects] = await pool.execute(`
    SELECT id, name AS nombre, creator AS desarrolladoPor,
           progress_percent AS avance, stage AS etapa,
           requirements AS requerimientos, image_url AS imagen
    FROM projects WHERE id = ? LIMIT 1
  `, [id]);
  if (!projects.length) return res.status(404).json({ error: 'Proyecto no encontrado.' });

  const [weeks] = await pool.execute(`
    SELECT id, label, start_date AS startDate, end_date AS endDate, sort_order AS sortOrder
    FROM weeks
    WHERE project_id = ?
    ORDER BY sort_order ASC, id ASC
  `, [id]);

  if (weeks.length) {
    const ids = weeks.map((w) => w.id);
    const placeholders = ids.map(() => '?').join(',');
    const [activities] = await pool.query(`
      SELECT id, week_id AS weekId, description,
             is_completed AS isCompleted,
             not_completed_reason AS notCompletedReason,
             created_by AS createdBy,
             updated_at AS updatedAt
      FROM activities
      WHERE week_id IN (${placeholders})
      ORDER BY id ASC
    `, ids);
    const byWeek = new Map(weeks.map((w) => [w.id, []]));
    activities.forEach((a) => byWeek.get(a.weekId)?.push({ ...a, isCompleted: Boolean(a.isCompleted) }));
    weeks.forEach((w) => { w.actividades = byWeek.get(w.id) || []; });
  }

  res.json({ ...projects[0], semanas: weeks });
});

app.post('/api/projects', async (req, res) => {
  const name = cleanText(req.body.name, 180);
  const creator = cleanText(req.body.creator, 140);
  const requirements = cleanText(req.body.requirements, 5000);
  const imageUrl = cleanText(req.body.imageUrl, 1000);
  const stage = cleanText(req.body.stage, 40);
  const progressPercent = Number(req.body.progressPercent);
  const weeks = Array.isArray(req.body.weeks) ? req.body.weeks : [];
  const validStages = new Set(['Ideas', 'En progreso', 'Terminado']);

  if (!name) return res.status(400).json({ error: 'Escribe el nombre del proyecto.' });
  if (!creator) return res.status(400).json({ error: 'Escribe el creador del proyecto.' });
  if (!validStages.has(stage)) return res.status(400).json({ error: 'Selecciona una etapa válida.' });
  if (!Number.isInteger(progressPercent) || progressPercent < 0 || progressPercent > 100) {
    return res.status(400).json({ error: 'El avance debe ser un número entero entre 0 y 100.' });
  }
  if (!weeks.length) return res.status(400).json({ error: 'Agrega al menos una semana.' });

  const normalizedWeeks = [];
  for (let i = 0; i < weeks.length; i += 1) {
    const week = weeks[i] || {};
    const label = cleanText(week.label, 160);
    const startDate = cleanText(week.startDate, 10) || null;
    const endDate = cleanText(week.endDate, 10) || null;
    const activities = Array.isArray(week.activities) ? week.activities : [];
    if (!label) return res.status(400).json({ error: `La semana ${i + 1} necesita un nombre.` });
    if (!activities.length) return res.status(400).json({ error: `La semana ${i + 1} necesita al menos una actividad.` });

    const normalizedActivities = activities
      .map((activity) => cleanText(activity?.description, 3000))
      .filter(Boolean);
    if (!normalizedActivities.length) {
      return res.status(400).json({ error: `La semana ${i + 1} necesita al menos una actividad válida.` });
    }

    normalizedWeeks.push({
      label,
      startDate,
      endDate,
      sortOrder: Number.isInteger(Number(week.sortOrder)) ? Number(week.sortOrder) : i,
      activities: normalizedActivities,
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [projectResult] = await connection.execute(`
      INSERT INTO projects (name, creator, progress_percent, stage, requirements, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, creator, progressPercent, stage, requirements || null, imageUrl || null]);

    const projectId = projectResult.insertId;

    for (const week of normalizedWeeks) {
      const [weekResult] = await connection.execute(`
        INSERT INTO weeks (project_id, label, start_date, end_date, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `, [projectId, week.label, week.startDate, week.endDate, week.sortOrder]);

      for (const description of week.activities) {
        await connection.execute(`
          INSERT INTO activities (week_id, description, is_completed, not_completed_reason, created_by)
          VALUES (?, ?, 0, NULL, ?)
        `, [weekResult.insertId, description, creator]);
      }
    }

    await connection.commit();
    res.status(201).json({ id: projectId, ok: true });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

app.post('/api/activities', async (req, res) => {
  const weekId = Number(req.body.weekId);
  const description = cleanText(req.body.description, 3000);
  const createdBy = cleanText(req.body.createdBy, 140);
  const isCompleted = Boolean(req.body.isCompleted);
  const reason = cleanText(req.body.notCompletedReason, 3000);

  if (!Number.isInteger(weekId) || weekId < 1) return res.status(400).json({ error: 'Selecciona una semana válida.' });
  if (!description) return res.status(400).json({ error: 'Escribe la actividad.' });
  if (!createdBy) return res.status(400).json({ error: 'Escribe quién registra la actividad.' });
  if (!isCompleted && !reason) return res.status(400).json({ error: 'Si no se realizó, explica el motivo.' });

  const [week] = await pool.execute('SELECT id FROM weeks WHERE id = ? LIMIT 1', [weekId]);
  if (!week.length) return res.status(404).json({ error: 'La semana no existe.' });

  const [result] = await pool.execute(`
    INSERT INTO activities (week_id, description, is_completed, not_completed_reason, created_by)
    VALUES (?, ?, ?, ?, ?)
  `, [weekId, description, isCompleted ? 1 : 0, isCompleted ? null : reason, createdBy]);

  res.status(201).json({ id: result.insertId, ok: true });
});

app.patch('/api/activities/:id', async (req, res) => {
  const id = Number(req.params.id);
  const isCompleted = Boolean(req.body.isCompleted);
  const reason = cleanText(req.body.notCompletedReason, 3000);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'ID inválido.' });
  if (!isCompleted && !reason) return res.status(400).json({ error: 'Si no se realizó, explica el motivo.' });

  const [result] = await pool.execute(`
    UPDATE activities
    SET is_completed = ?, not_completed_reason = ?
    WHERE id = ?
  `, [isCompleted ? 1 : 0, isCompleted ? null : reason, id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Actividad no encontrada.' });
  res.json({ ok: true });
});

app.patch('/api/projects/:id/progress', async (req, res) => {
  const id = Number(req.params.id);
  const progressPercent = Number(req.body.progressPercent);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'ID de proyecto inválido.' });
  }
  if (!Number.isInteger(progressPercent) || progressPercent < 0 || progressPercent > 100) {
    return res.status(400).json({ error: 'El avance debe ser un número entero entre 0 y 100.' });
  }

  const stage = progressPercent === 100 ? 'Terminado' : 'En progreso';
  const [result] = await pool.execute(`
    UPDATE projects
    SET progress_percent = ?, stage = ?
    WHERE id = ?
  `, [progressPercent, stage, id]);

  if (!result.affectedRows) {
    return res.status(404).json({ error: 'Proyecto no encontrado.' });
  }

  res.json({ ok: true, progressPercent, stage });
});

app.post('/api/projects/:id/weeks', async (req, res) => {
  const projectId = Number(req.params.id);
  const label = cleanText(req.body.label, 160);
  const startDate = cleanText(req.body.startDate, 10) || null;
  const endDate = cleanText(req.body.endDate, 10) || null;
  const activities = Array.isArray(req.body.activities)
    ? req.body.activities.map((item) => cleanText(item, 3000)).filter(Boolean)
    : [];

  if (!Number.isInteger(projectId) || projectId < 1) {
    return res.status(400).json({ error: 'ID de proyecto inválido.' });
  }
  if (!label) return res.status(400).json({ error: 'Escribe el nombre de la semana.' });
  if (!activities.length) return res.status(400).json({ error: 'Agrega al menos una actividad.' });

  const [projects] = await pool.execute('SELECT id, creator FROM projects WHERE id = ? LIMIT 1', [projectId]);
  if (!projects.length) return res.status(404).json({ error: 'Proyecto no encontrado.' });

  const [[orderRow]] = await pool.execute(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 AS nextOrder FROM weeks WHERE project_id = ?',
    [projectId]
  );

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [weekResult] = await connection.execute(`
      INSERT INTO weeks (project_id, label, start_date, end_date, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `, [projectId, label, startDate, endDate, Number(orderRow.nextOrder || 0)]);

    for (const description of activities) {
      await connection.execute(`
        INSERT INTO activities (week_id, description, is_completed, not_completed_reason, created_by)
        VALUES (?, ?, 0, NULL, ?)
      `, [weekResult.insertId, description, projects[0].creator]);
    }

    await connection.commit();
    res.status(201).json({ ok: true, weekId: weekResult.insertId });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

app.get('/api/form-options', async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT p.id AS projectId, p.name AS projectName, w.id AS weekId, w.label AS weekLabel
    FROM projects p
    JOIN weeks w ON w.project_id = p.id
    ORDER BY p.name ASC, w.sort_order ASC, w.id ASC
  `);
  res.json(rows);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`IA Envasado disponible en http://localhost:${PORT}`);
});
