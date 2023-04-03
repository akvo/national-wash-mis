const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    ["/api/**", "/static-files/**"],
    createProxyMiddleware({
      target: "http://localhost:8000",
      changeOrigin: true,
    })
  );
  app.use(
    ["/config.js"],
    createProxyMiddleware({
      target: "http://localhost:8000",
      changeOrigin: true,
      pathRewrite: {
        "^/config.js": "/api/v1/config.js",
      },
    })
  );
  app.use(
    ["/i18n.js"],
    createProxyMiddleware({
      target: "http://localhost:8000",
      changeOrigin: true,
      pathRewrite: {
        "^/i18n.js": "/api/v1/i18n.js",
      },
    })
  );
};
