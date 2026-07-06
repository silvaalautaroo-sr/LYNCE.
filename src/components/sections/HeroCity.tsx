{/* Main headline */}
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
              {/* Line 1 — "Smart" — Inter Black Italic */}
              <motion.span
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="block"
                style={{
                  color: "var(--ink)",
                  fontStyle: "italic",
                  fontWeight: 900,
                }}
              >
                {t("line1")}
              </motion.span>

              {/* Line 2 — gradient accent, Inter Black (not italic) */}
              <motion.span
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="block hero-word-gradient"
                style={{ fontWeight: 900 }}
              >
                {t("line2")}
              </motion.span>

              {/* Line 3 — "for" — plain */}
              <motion.span
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
                className="block"
                style={{
                  fontSize: "0.76em",
                  color: "var(--ink-muted)",
                  fontWeight: 900,
                }}
              >
                {t("line3")}
              </motion.span>

              {/* Line 4 — "Smart Cities" — Inter Black Italic on "Smart" only */}
              <motion.span
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
                className="block hero-word-gradient"
                style={{ fontSize: "0.76em", fontWeight: 900 }}
              >
                <span style={{ fontStyle: "italic" }}>Smart</span>
                {" "}
                <span style={{ fontStyle: "normal" }}>Cities</span>
              </motion.span>
            </h1>
