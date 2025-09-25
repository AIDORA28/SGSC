-- Inserción de datos iniciales para el sistema SGSC

-- Insertar turnos básicos
INSERT INTO turno (nombre_turno, hora_inicio, hora_fin) VALUES
('Mañana', '06:00:00', '14:00:00'),
('Tarde', '14:00:00', '22:00:00'),
('Noche', '22:00:00', '06:00:00');

-- Insertar sectores básicos
INSERT INTO sector (nombre_sector, descripcion) VALUES
('Centro', 'Zona céntrica de la ciudad'),
('Norte', 'Sector norte de la jurisdicción'),
('Sur', 'Sector sur de la jurisdicción'),
('Este', 'Sector este de la jurisdicción'),
('Oeste', 'Sector oeste de la jurisdicción');

-- Insertar anexos por sector
INSERT INTO anexo (nombre_anexo, sector_id) VALUES
-- Anexos del Centro
('Plaza Principal', 1),
('Mercado Central', 1),
('Parque Central', 1),
-- Anexos del Norte
('Urbanización Los Pinos', 2),
('Avenida Norte', 2),
-- Anexos del Sur
('Villa El Sol', 3),
('Zona Industrial', 3),
-- Anexos del Este
('Barrio San José', 4),
('Terminal Terrestre', 4),
-- Anexos del Oeste
('Residencial Las Flores', 5),
('Zona Comercial Oeste', 5);

-- Insertar cabinas básicas
INSERT INTO cabina (numero_cabina, descripcion) VALUES
('CAB-001', 'Cabina principal - Centro'),
('CAB-002', 'Cabina sector Norte'),
('CAB-003', 'Cabina sector Sur'),
('CAB-004', 'Cabina sector Este'),
('CAB-005', 'Cabina sector Oeste');

-- Insertar personal básico (algunos ejemplos)
INSERT INTO personal (dni, nombres, apellidos, cargo, estado, sector_asignado, turno_asignado) VALUES
('12345678', 'Juan Carlos', 'Pérez García', 'supervisor', 'activo', 1, 1),
('87654321', 'María Elena', 'López Rodríguez', 'sereno', 'activo', 1, 1),
('11223344', 'Carlos Alberto', 'Mendoza Silva', 'chofer', 'activo', 2, 2),
('44332211', 'Ana Sofía', 'Vargas Torres', 'sereno', 'activo', 2, 2),
('55667788', 'Roberto', 'Castillo Morales', 'cámara', 'activo', 3, 3),
('88776655', 'Patricia', 'Herrera Vega', 'sereno', 'activo', 3, 3);

-- Insertar movilidades básicas
INSERT INTO movilidad (placa, tipo, chofer_asignado, sector_asignado, kilometraje_inicial) VALUES
('ABC-123', 'patrulla', 3, 1, 50000.00),
('DEF-456', 'moto', 4, 2, 15000.00),
('GHI-789', 'camioneta', 3, 3, 75000.00);

-- Insertar supervisores
INSERT INTO supervisor (personal_id, sector_id, turno_id) VALUES
(1, 1, 1), -- Juan Carlos supervisa Centro en turno Mañana
(1, 1, 2), -- Juan Carlos supervisa Centro en turno Tarde
(1, 1, 3); -- Juan Carlos supervisa Centro en turno Noche