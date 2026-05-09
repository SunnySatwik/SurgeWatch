/**
 * SurgeWatch Database Layer (SQLite)
 * 
 * Zero-config, file-based database that requires no external server.
 * The database file is created automatically on first run.
 * 
 * Usage:
 *   const db = require('./db');
 *   const rows = db.query('SELECT * FROM hospitals');
 *   db.run('INSERT INTO alerts (hospital_id, severity, title, message) VALUES (?, ?, ?, ?)', [1, 'warning', 'Test', 'Test alert']);
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'surgewatch.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

let db;

/**
 * Initialize the database: create tables and seed if fresh.
 */
function initialize() {
    const isNewDb = !fs.existsSync(DB_PATH);

    db = new Database(DB_PATH);

    // Enable WAL mode for better concurrent read performance
    db.pragma('journal_mode = WAL');
    // Enable foreign keys (SQLite has them off by default)
    db.pragma('foreign_keys = ON');

    if (isNewDb) {
        console.log('[DB] Creating new database...');
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        db.exec(schema);
        console.log('[DB] Schema created successfully.');

        // Seed with sample data
        try {
            const seed = fs.readFileSync(SEED_PATH, 'utf8');
            db.exec(seed);
            console.log('[DB] Seed data loaded successfully.');
        } catch (err) {
            console.warn('[DB] Seed data could not be loaded:', err.message);
        }
    } else {
        console.log('[DB] Connected to existing database.');
    }

    return db;
}

/**
 * Get the database instance, initializing if needed.
 */
function getDb() {
    if (!db) {
        initialize();
    }
    return db;
}

/**
 * Run a SELECT query and return all matching rows.
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Array} Array of row objects
 */
function query(sql, params = []) {
    return getDb().prepare(sql).all(...params);
}

/**
 * Run an INSERT/UPDATE/DELETE statement.
 * @param {string} sql - SQL statement
 * @param {Array} params - Statement parameters
 * @returns {object} { changes, lastInsertRowid }
 */
function run(sql, params = []) {
    return getDb().prepare(sql).run(...params);
}

/**
 * Get a single row from a query.
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {object|undefined} Single row or undefined
 */
function get(sql, params = []) {
    return getDb().prepare(sql).get(...params);
}

/**
 * Run multiple statements in a transaction.
 * @param {Function} fn - Function containing database operations
 * @returns {*} Return value of fn
 */
function transaction(fn) {
    return getDb().transaction(fn)();
}

/**
 * Close the database connection gracefully.
 */
function close() {
    if (db) {
        db.close();
        db = null;
        console.log('[DB] Connection closed.');
    }
}

// Ensure graceful shutdown
process.on('exit', close);
process.on('SIGINT', () => { close(); process.exit(0); });
process.on('SIGTERM', () => { close(); process.exit(0); });

module.exports = {
    initialize,
    getDb,
    query,
    run,
    get,
    transaction,
    close
};
