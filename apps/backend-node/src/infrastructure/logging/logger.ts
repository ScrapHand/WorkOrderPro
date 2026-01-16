import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: isDev ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard',
        },
    } : undefined,
    formatters: {
        level: (label) => {
            return { level: label.toUpperCase() };
        },
    },
    // Redact sensitive information
    redact: ['password', 'token', 'secrets', 'req.headers.cookie'],
    timestamp: pino.stdTimeFunctions.isoTime,
});

export const httpLogger = (req: any, res: any, next: any) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
            msg: 'HTTP Request',
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            tenant: req.get('x-tenant-slug') || 'none',
        });
    });
    next();
};
