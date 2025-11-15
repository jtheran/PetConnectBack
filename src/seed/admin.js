import { encryptPass } from '../libs/bcrypt.js';
import config from '../config/config.js';
import logger from '../logs/logger.js';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function initializeSystemPermissions() {
    const permissionsList = [
        "manage_users",
        "create_post",
        "edit_post",
        "delete_post",
        "manage_roles",
        "manage_permissions",
        "view_logs",
        "manage_pets",
        "manage_chats",
        "manage_reports"
    ];

    for (const perm of permissionsList) {
        const existing = await prisma.permission.findUnique({
            where: { name: perm }
        });

        if (!existing) {
            await prisma.permission.create({
                data: { name: perm, desc: `Permiso: ${perm}` }
            });
            logger.info(`[PERMISSION] Created permission: ${perm}`);
        }
    }

    return await prisma.permission.findMany();
}

async function initializeAdminRole(allPermissions) {
    let adminRole = await prisma.role.findUnique({
        where: { name: "ADMIN" }
    });

    if (!adminRole) {
        adminRole = await prisma.role.create({
            data: {
                name: "ADMIN",
                desc: "Administrador del sistema",
            }
        });

        logger.info("[ROLE] Created ADMIN role");
    }

    // Asignar todos los permisos al rol admin
    for (const perm of allPermissions) {
        const exists = await prisma.rolePermission.findFirst({
            where: {
                roleId: adminRole.id,
                permissionId: perm.id
            }
        });

        if (!exists) {
            await prisma.rolePermission.create({
                data: {
                    roleId: adminRole.id,
                    permissionId: perm.id
                }
            });
        }
    }

    logger.info("[ROLE] ADMIN now has all permissions");

    return adminRole;
}

async function createAdminUser() {
    try {
        // 1️⃣ Crear permisos
        const allPermissions = await initializeSystemPermissions();

        // 2️⃣ Crear ADMIN role + attach permissions
        const adminRole = await initializeAdminRole(allPermissions);

        // 3️⃣ Verificar si existe el usuario admin
        let adminUser = await prisma.user.findUnique({
            where: {
                email: config.emailAdmin
            }
        });

        if (!adminUser) {
            const hashedPassword = await encryptPass(config.passAdmin);

            adminUser = await prisma.user.create({
                data: {
                    name: "Super Admin",
                    email: config.emailAdmin,
                    password: hashedPassword,
                },
            });

            logger.info("[USER] Admin user created successfully!");
        } else {
            logger.warn("[USER] Admin user already exists.");
        }

        // 4️⃣ Asegurar que el usuario admin tenga el rol ADMIN
        const exists = await prisma.userRole.findFirst({
            where: {
                userId: adminUser.id,
                roleId: adminRole.id
            }
        });

        if (!exists) {
            await prisma.userRole.create({
                data: {
                    userId: adminUser.id,
                    roleId: adminRole.id
                }
            });

            logger.info("[USER] Admin user assigned ADMIN role");
        }

        logger.info("[INIT] System admin, roles and permissions initialized successfully!");
    } catch (err) {
        logger.error('[SERVER] Internal error creating admin: ' + err.message);
        throw new Error(err);
    }
}

export default createAdminUser;
