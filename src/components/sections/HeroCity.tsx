return (
    <section id="hero" aria-label="Hero" className="relative h-screen w-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* pointer-events-none — lets mouse events pass through to the canvas below */}
      <div className="absolute inset-0 flex items-center pointer-events-none">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="w-full md:w-[62%]">

            <h1
              aria-label={`${t("line1")} ${t("line2")} ${t("line3")} ${t("line4")}`}
              className="tracking-tight select-none"
              style={{
                fontFamily: "var(--font-inter), Inter, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(2.75rem, 8vw, 6.8rem)",
                lineHeight: 1.15,
                paddingBottom: "0.08em",
              }}
            >
              <motion.span
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="block"
                style={{ color: "var(--ink)", fontStyle: "italic", fontWeight: 900 }}
              >
                {t("line1")}
              </motion.span>

              <motion.span
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="block hero-word-gradient"
                style={{ fontWeight: 900 }}
              >
                {t("line2")}
              </motion.span>

              <motion.span
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
                className="block"
                style={{ fontSize: "0.76em", color: "var(--ink-muted)", fontWeight: 900 }}
              >
                {t("line3")}
              </motion.span>

              <motion.span
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
                className="block hero-word-gradient"
                style={{ fontSize: "0.76em", fontWeight: 900 }}
              >
                <span style={{ fontStyle: "italic" }}>Smart</span>{" "}
                <span style={{ fontStyle: "normal" }}>Cities</span>
              </motion.span>
            </h1>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.3, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 h-px w-14 bg-gradient-to-r from-accent-primary/60 to-transparent"
              style={{ transformOrigin: "left" }}
            />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
      >
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="h-8 w-px bg-gradient-to-b from-white/20 to-transparent"
        />
      </motion.div>
    </section>
  );
}
