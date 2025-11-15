export const checkPermission = (permission) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Verificar si tiene ese permiso
      const userPermissions = user.permissions || [];

      if (!userPermissions.includes(permission)) {
        return res.status(403).json({ message: "No tienes permisos" });
      }

      next();
    } catch (err) {
      return res.status(500).json({ message: "Error validando permisos" });
    }
  };
};