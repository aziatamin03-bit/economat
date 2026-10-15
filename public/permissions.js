/**
 * permissions.js - نظام صلاحيات OBAYOLI
 */
(() => {
  window.ObayoliAdmin = window.ObayoliAdmin || {
    applyPermissions: function (user, moduleName) {
      if (!user) return { read: true, write: true };
      if (user.role === 'admin' || user.role === 'superadmin' || user.role === 'public') {
        return { read: true, write: true };
      }
      const modulePerms = user.permissions && user.permissions[moduleName];
      if (modulePerms) {
        return {
          read: Boolean(modulePerms.read !== false),
          write: Boolean(modulePerms.write !== false)
        };
      }
      return { read: true, write: true };
    }
  };
})();
