-- Migración inicial para crear todas las tablas del sistema SGSC
-- Basado en FlujoTablas.md

-- Tabla: Turno
CREATE TABLE turno (
    id_turno SERIAL PRIMARY KEY,
    nombre_turno VARCHAR(50) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Sector
CREATE TABLE sector (
    id_sector SERIAL PRIMARY KEY,
    nombre_sector VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Personal
CREATE TABLE personal (
    id_personal SERIAL PRIMARY KEY,
    dni VARCHAR(8) UNIQUE NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    cargo VARCHAR(50) NOT NULL, -- sereno, supervisor, chofer, cámara, etc.
    estado VARCHAR(20) DEFAULT 'activo', -- activo / inactivo
    sector_asignado INTEGER REFERENCES sector(id_sector),
    turno_asignado INTEGER REFERENCES turno(id_turno),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Anexo
CREATE TABLE anexo (
    id_anexo SERIAL PRIMARY KEY,
    nombre_anexo VARCHAR(100) NOT NULL,
    sector_id INTEGER NOT NULL REFERENCES sector(id_sector),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Cabina
CREATE TABLE cabina (
    id_cabina SERIAL PRIMARY KEY,
    numero_cabina VARCHAR(20) NOT NULL,
    descripcion TEXT,
    personal_asignado INTEGER REFERENCES personal(id_personal),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Movilidad
CREATE TABLE movilidad (
    id_movilidad SERIAL PRIMARY KEY,
    placa VARCHAR(10) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- patrulla, moto, camioneta, etc.
    chofer_asignado INTEGER REFERENCES personal(id_personal),
    sector_asignado INTEGER REFERENCES sector(id_sector),
    kilometraje_inicial DECIMAL(10,2),
    kilometraje_final DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Patrullaje
CREATE TABLE patrullaje (
    id_patrullaje SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME,
    tipo VARCHAR(20) NOT NULL, -- a pie, móvil, moto
    sector_id INTEGER NOT NULL REFERENCES sector(id_sector),
    anexo_id INTEGER REFERENCES anexo(id_anexo), -- opcional
    personal_id INTEGER NOT NULL REFERENCES personal(id_personal),
    movilidad_id INTEGER REFERENCES movilidad(id_movilidad), -- opcional
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Supervisor
CREATE TABLE supervisor (
    id_supervisor SERIAL PRIMARY KEY,
    personal_id INTEGER NOT NULL REFERENCES personal(id_personal),
    sector_id INTEGER NOT NULL REFERENCES sector(id_sector),
    turno_id INTEGER NOT NULL REFERENCES turno(id_turno),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Incidencia
CREATE TABLE incidencia (
    id_incidencia SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    descripcion TEXT NOT NULL,
    tipo_incidencia VARCHAR(100) NOT NULL, -- robo, disturbio, emergencia médica, etc.
    sector_id INTEGER NOT NULL REFERENCES sector(id_sector),
    anexo_id INTEGER REFERENCES anexo(id_anexo), -- opcional
    personal_reporta INTEGER NOT NULL REFERENCES personal(id_personal),
    patrullaje_id INTEGER NOT NULL REFERENCES patrullaje(id_patrullaje),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: BitacoraCabina
CREATE TABLE bitacora_cabina (
    id_bitacora SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    cabina_id INTEGER NOT NULL REFERENCES cabina(id_cabina),
    personal_id INTEGER NOT NULL REFERENCES personal(id_personal),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_personal_dni ON personal(dni);
CREATE INDEX idx_personal_cargo ON personal(cargo);
CREATE INDEX idx_personal_estado ON personal(estado);
CREATE INDEX idx_patrullaje_fecha ON patrullaje(fecha);
CREATE INDEX idx_patrullaje_sector ON patrullaje(sector_id);
CREATE INDEX idx_incidencia_fecha ON incidencia(fecha);
CREATE INDEX idx_incidencia_tipo ON incidencia(tipo_incidencia);
CREATE INDEX idx_bitacora_fecha ON bitacora_cabina(fecha);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at en todas las tablas
CREATE TRIGGER update_turno_updated_at BEFORE UPDATE ON turno FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sector_updated_at BEFORE UPDATE ON sector FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personal_updated_at BEFORE UPDATE ON personal FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_anexo_updated_at BEFORE UPDATE ON anexo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cabina_updated_at BEFORE UPDATE ON cabina FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_movilidad_updated_at BEFORE UPDATE ON movilidad FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patrullaje_updated_at BEFORE UPDATE ON patrullaje FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supervisor_updated_at BEFORE UPDATE ON supervisor FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incidencia_updated_at BEFORE UPDATE ON incidencia FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bitacora_cabina_updated_at BEFORE UPDATE ON bitacora_cabina FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();