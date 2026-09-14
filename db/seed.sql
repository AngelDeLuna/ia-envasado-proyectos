INSERT INTO projects (id, name, creator, progress_percent, stage, requirements, image_url)
VALUES
  (1, 'Ahorros 3D', 'Angel De Luna', 70, 'En progreso', 'Go Pro, Software para modelado', NULL),
  (2, 'Interfaz Data Analisis', 'Angel De Luna', 50, 'En progreso', NULL, NULL)
ON DUPLICATE KEY UPDATE
  name=VALUES(name), creator=VALUES(creator), progress_percent=VALUES(progress_percent),
  stage=VALUES(stage), requirements=VALUES(requirements);

INSERT INTO weeks (id, project_id, label, sort_order)
VALUES
  (1, 1, 'Semana 1 (5 sept)', 1),
  (2, 1, 'Semana 2 (8-12 sept)', 2),
  (3, 2, 'Semana 1 (5 sept)', 1),
  (4, 2, 'Semana 2 (8-12 sept)', 2)
ON DUPLICATE KEY UPDATE label=VALUES(label), sort_order=VALUES(sort_order);

INSERT INTO activities (id, week_id, description, is_completed, not_completed_reason, created_by)
VALUES
  (1, 1, 'Se realizó menú para mostrar las piezas.', 1, NULL, 'Angel De Luna'),
  (2, 1, 'Se trabajó con la base de datos para mostrar las piezas.', 1, NULL, 'Angel De Luna'),
  (3, 2, 'Trabajar con los fondos.', 0, 'Pendiente de ejecución.', 'Angel De Luna'),
  (4, 2, 'Mejorar interfaz.', 0, 'Pendiente de ejecución.', 'Angel De Luna'),
  (5, 2, 'Ver interactividad.', 0, 'Pendiente de ejecución.', 'Angel De Luna'),
  (6, 3, 'Se realizó interfaz para mostrar datos de una manera más interactiva.', 1, NULL, 'Angel De Luna'),
  (7, 3, 'Se cargaron 3 archivos de muestra.', 1, NULL, 'Angel De Luna'),
  (8, 4, 'Mejorar display de cada gráfico.', 0, 'Pendiente de ejecución.', 'Angel De Luna'),
  (9, 4, 'Hacer conexión de IA.', 0, 'Pendiente de ejecución.', 'Angel De Luna'),
  (10, 4, 'Mostrar más datos.', 0, 'Pendiente de ejecución.', 'Angel De Luna')
ON DUPLICATE KEY UPDATE
  description=VALUES(description), is_completed=VALUES(is_completed),
  not_completed_reason=VALUES(not_completed_reason), created_by=VALUES(created_by);
