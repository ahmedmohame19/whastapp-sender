import whatsappRoutes from './routes/WhatsappRoutes.js';

export const appRouter = (app, express) => {
  // middleware for display image in uploads
  app.use("/uploads", express.static("uploads"));
  
  // parsing
  app.use(express.json());

  // WhatsApp service routes
  app.use("/api/whatsapp", whatsappRoutes);

  // 404 handler - must be after all routes
  app.all("*", (req, res, next) => {
    return next(new Error("page not found", { cause: 404 }));
  });
  
  // global error handler - must be last
  app.use((error, req, res, next) => {
    return res
      .status(error.cause || 500)
      .json({ success: false, message: error.message, stack: error.stack });
  });
};
