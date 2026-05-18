-- KPI Database Schema for 24/7 Letter Quantification System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- KPI Categories enum
CREATE TYPE kpi_category AS ENUM (
    'volatility',
    'usage_pattern',
    'liquidity',
    'sentiment',
    'network_effect',
    'dequantification'
);

-- KPIs table
CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category kpi_category NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    description TEXT,
    letter VARCHAR(10) DEFAULT 'all',
    confidence DECIMAL(3, 2) DEFAULT 0.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_kpis_category ON kpis(category);
CREATE INDEX idx_kpis_letter ON kpis(letter);
CREATE INDEX idx_kpis_created_at ON kpis(created_at DESC);
CREATE INDEX idx_kpis_name ON kpis(name);

-- KPI History table (for time-series analysis)
CREATE TABLE kpi_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_id UUID REFERENCES kpis(id) ON DELETE CASCADE,
    value DECIMAL(10, 2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_kpi_history_kpi_id ON kpi_history(kpi_id);
CREATE INDEX idx_kpi_history_recorded_at ON kpi_history(recorded_at DESC);

-- Analysis Cycles table (tracks each analysis run)
CREATE TABLE analysis_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cycle_end TIMESTAMP WITH TIME ZONE,
    primitives_fetched INTEGER,
    kpis_generated INTEGER,
    llm_confidence_avg DECIMAL(3, 2),
    status VARCHAR(50) DEFAULT 'completed',
    error_message TEXT
);

CREATE INDEX idx_analysis_cycles_cycle_start ON analysis_cycles(cycle_start DESC);

-- KPI Alerts table (for threshold-based alerts)
CREATE TABLE kpi_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_id UUID REFERENCES kpis(id) ON DELETE CASCADE,
    threshold_value DECIMAL(10, 2) NOT NULL,
    condition VARCHAR(10) NOT NULL CHECK (condition IN ('above', 'below')),
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    notification_sent BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_kpi_alerts_kpi_id ON kpi_alerts(kpi_id);
CREATE INDEX idx_kpi_alerts_is_active ON kpi_alerts(is_active);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_kpis_updated_at BEFORE UPDATE ON kpis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get KPI summary statistics
CREATE OR REPLACE FUNCTION get_kpi_summary()
RETURNS TABLE (
    category kpi_category,
    total_kpis BIGINT,
    avg_value DECIMAL(10, 2),
    max_value DECIMAL(10, 2),
    min_value DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        category,
        COUNT(*) as total_kpis,
        AVG(value) as avg_value,
        MAX(value) as max_value,
        MIN(value) as min_value
    FROM kpis
    GROUP BY category;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent KPIs by letter
CREATE OR REPLACE FUNCTION get_letter_kpis(target_letter VARCHAR, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    category kpi_category,
    value DECIMAL(10, 2),
    description TEXT,
    confidence DECIMAL(3, 2),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.id,
        k.name,
        k.category,
        k.value,
        k.description,
        k.confidence,
        k.created_at
    FROM kpis k
    WHERE k.letter = UPPER(target_letter)
    ORDER BY k.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check and trigger alerts
CREATE OR REPLACE FUNCTION check_kpi_alerts()
RETURNS TABLE (
    alert_id UUID,
    kpi_name VARCHAR(255),
    current_value DECIMAL(10, 2),
    threshold_value DECIMAL(10, 2),
    condition VARCHAR(10)
) AS $$
DECLARE
    triggered_alerts RECORD;
BEGIN
    FOR triggered_alerts IN 
        SELECT 
            a.id as alert_id,
            k.name as kpi_name,
            k.value as current_value,
            a.threshold_value,
            a.condition
        FROM kpi_alerts a
        JOIN kpis k ON a.kpi_id = k.id
        WHERE a.is_active = true
        AND (
            (a.condition = 'above' AND k.value > a.threshold_value)
            OR
            (a.condition = 'below' AND k.value < a.threshold_value)
        )
    LOOP
        RETURN NEXT triggered_alerts;
        
        -- Update last_triggered_at
        UPDATE kpi_alerts 
        SET last_triggered_at = NOW(),
            notification_sent = false
        WHERE id = triggered_alerts.alert_id;
    END LOOP;
    RETURN;
END;
$$ LANGUAGE plpgsql;
