DROP TABLE IF EXISTS records;

CREATE TABLE IF NOT EXISTS records(
    id SERIAL PRIMARY KEY,
    countryname VARCHAR(255),
    countryCode VARCHAR(255),
    confirmed BIGINT,
    deaths BIGINT,
    recovered BIGINT,
    date  VARCHAR(255)
);