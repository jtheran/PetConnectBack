import axios from "axios";
import pkg from "@prisma/client";
import createToken from '../libs/jwt.js';
import logger from '../logs/logger.js';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

