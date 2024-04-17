import { useRef, useEffect, useState, useCallback } from "react";
import {
  bootstrapCameraKit,
  createMediaStreamSource,
  CameraKit,
  CameraKitSession,
} from "@snap/camera-kit";
import { motion, AnimatePresence, Transition, Variants } from "framer-motion";

import "./App.css";

const LENS_GROUP_ID = "a32a0fa8-154f-448f-ba48-82aeec13744c";
const bounceTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 20,
  duration: 3.0,
  repeat: Infinity,
  repeatType: "reverse",
};
export const App = () => {
  const cameraKitRef = useRef<CameraKit>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<CameraKitSession>();

  const mediaStreamRef = useRef<MediaStream>();

  const [isInitialized, setIsInitialized] = useState(false);
  console.log("isInitialized", isInitialized);

  useEffect(() => {
    async function initCameraKit() {
      const cameraKit = await bootstrapCameraKit({
        logger: "console",
        apiToken:
          "eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzEwMTcyNTEyLCJzdWIiOiJiYWYwMTA2Mi1hZDc4LTRmZTctOGI4NC02NmYwY2VjN2RhYjF-U1RBR0lOR340NDJjMThiMS01OTAyLTRhMjYtYWIxZC1lYzIwZDcyNmI1NjMifQ.LFdUtQstJsp5ywheUW7fSZ-cVB_QNIPpK6MLUBwn5O4",
      });
      cameraKitRef.current = cameraKit;

      const { lenses } = await cameraKit.lensRepository.loadLensGroups([
        LENS_GROUP_ID,
      ]);

      // Init Session

      const session = await cameraKit.createSession({
        liveRenderTarget: canvasRef.current || undefined,
      });
      sessionRef.current = session;
      session.events.addEventListener("error", (event) =>
        console.error(event.detail)
      );
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log("device", devices);
      const backCamera = devices.find(
        (device) =>
          device.kind === "videoinput" &&
          device.label === "Back Ultra Wide Camera" // Get the wider camera on iPhone / TODO test on Android
      );
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { min: 640, ideal: 1920 },
          height: { min: 400, ideal: 1080 },
          deviceId: backCamera ? { exact: backCamera?.deviceId } : undefined,
        },
      });

      mediaStreamRef.current = mediaStream;

      const source = createMediaStreamSource(mediaStream, {
        cameraType: "environment",
      });
      await session.setSource(source);
      await session.applyLens(lenses[0]);

      session.play();

      setIsInitialized(true);
    }

    if (!cameraKitRef.current) {
      initCameraKit();
    }

    return () => {
      sessionRef.current?.pause();
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {!isInitialized && (
        <AnimatePresence>
          <motion.div className="loading-screen">
            <AnimatePresence>
              <motion.img
                initial={{ scale: 0.5, opacity: 0.1 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={bounceTransition}
                src="/yaali.png"
                alt="yaali-logo"
                className="loading-image"
              />
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      )}
      <canvas
        ref={canvasRef}
        onCanPlay={() => {
          setIsInitialized(true);
        }}
        style={{
          width: "100%",
          height: "100%",
          visibility: isInitialized ? "visible" : "hidden",
        }}
      />
    </div>
  );
};
