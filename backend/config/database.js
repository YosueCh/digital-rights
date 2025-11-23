import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || join(__dirname, '../database/digital_rights.db');

// Crear directorio si no existe
const dbDir = dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Configurar SQLite en modo verbose para debugging
const sqlite = sqlite3.verbose();

class Database {
    constructor() {
        this.db = null;
    }

    // Conectar a la base de datos
    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite.Database(dbPath, (err) => {
                if (err) {
                    console.error('❌ Error al conectar a la base de datos:', err);
                    reject(err);
                } else {
                    console.log('✅ Conectado a la base de datos SQLite');
                    // Habilitar foreign keys
                    this.db.run('PRAGMA foreign_keys = ON');
                    resolve();
                }
            });
        });
    }

    // Ejecutar query (INSERT, UPDATE, DELETE)
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('❌ Error en run():', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Obtener una fila (SELECT)
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('❌ Error en get():', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Obtener múltiples filas (SELECT)
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('❌ Error en all():', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Inicializar tablas desde schema.sql
    async initializeTables() {
        try {
            const schemaPath = join(__dirname, '../database/schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            // Dividir por punto y coma y ejecutar cada statement
            const statements = schema
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            for (const statement of statements) {
                await this.run(statement);
            }
            
            console.log('✅ Tablas inicializadas correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar tablas:', error);
            throw error;
        }
    }

    // Cerrar conexión
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('✅ Conexión a base de datos cerrada');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

// Exportar instancia única (Singleton)
const database = new Database();
export default database;