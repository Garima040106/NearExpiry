const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== "object") {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }

    const cleanObject = {};

    for (const key in obj) {
        if (key.startsWith("$") || key.includes(".")) {
            continue;
        }

        cleanObject[key] = sanitizeObject(obj[key]);
    }

    return cleanObject;
};

const sanitize = (req, res, next) => {
    req.body = sanitizeObject(req.body);

    Object.defineProperty(req, "query", {
        value: sanitizeObject(req.query),
        writable: true,
        configurable: true
    });

    next();
};

module.exports = sanitize;
