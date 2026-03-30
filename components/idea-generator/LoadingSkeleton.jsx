import React from "react";
import { motion } from "framer-motion";

export default function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-xl border border-border/60 bg-card p-5 pl-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded-md animate-pulse" />
          </div>
          <div className="pl-10 space-y-2">
            <div className="h-3 w-full bg-muted rounded-md animate-pulse" />
            <div className="h-3 w-3/4 bg-muted rounded-md animate-pulse" />
          </div>
        </motion.div>
      ))}
      <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full"
        />
        Brewing creative ideas...
      </div>
    </div>
  );
}
