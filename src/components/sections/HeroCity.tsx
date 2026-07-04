{/* Main headline */}
            <h1
              aria-label="Smart Sight for Smart Cities"
              className="font-semibold leading-[1.0] tracking-tight select-none"
              style={{ fontSize: "clamp(2.4rem, 7vw, 5.8rem)" }}
            >
              <motion.span
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="block text-white dark:text-white light-hero-text"
              >
                Smart
              </motion.span>

              <motion.span
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.78, ease: [0.16, 1, 0.3, 1] }}
                className="block hero-word-gradient"
              >
                Sight
              </motion.span>

              <motion.span
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.91, ease: [0.16, 1, 0.3, 1] }}
                className="block text-white/75 dark:text-white/72 light-hero-subtext"
                style={{ fontSize: "0.78em" }}
              >
                for Smart
              </motion.span>

              <motion.span
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.04, ease: [0.16, 1, 0.3, 1] }}
                className="block hero-word-gradient"
                style={{ fontSize: "0.78em" }}
              >
                Cities
              </motion.span>
            </h1>
