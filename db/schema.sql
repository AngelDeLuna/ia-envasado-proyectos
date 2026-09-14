CREATE TABLE IF NOT EXISTS projects (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(180) NOT NULL,
  creator VARCHAR(140) NOT NULL DEFAULT '',
  progress_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
  stage ENUM('Ideas','En progreso','Terminado') NOT NULL DEFAULT 'Ideas',
  requirements TEXT NULL,
  image_url VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_projects_creator (creator),
  INDEX idx_projects_stage (stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS weeks (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id INT UNSIGNED NOT NULL,
  label VARCHAR(160) NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_weeks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_weeks_project_order (project_id, sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activities (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  week_id INT UNSIGNED NOT NULL,
  description TEXT NOT NULL,
  is_completed TINYINT(1) NOT NULL DEFAULT 0,
  not_completed_reason TEXT NULL,
  created_by VARCHAR(140) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_activities_week FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE CASCADE,
  INDEX idx_activities_week (week_id),
  INDEX idx_activities_completed (is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
