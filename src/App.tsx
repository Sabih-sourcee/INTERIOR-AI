import { useState, useRef, ChangeEvent } from 'react';
import { Camera, Upload, Layout, Sparkles, RefreshCw, CheckCircle2, AlertCircle, Maximize2, Cpu, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeRoom, generateRedesignedRoom, type RoomAnalysis } from './services/geminiService';

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [redesignedImage, setRedesignedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RoomAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        resetState();
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Could not access camera. Please check permissions.');
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg');
      setOriginalImage(dataUrl);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const resetState = () => {
    setRedesignedImage(null);
    setAnalysis(null);
    setError(null);
    setStatus('');
  };

  const resizeImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = dataUrl;
    });
  };

  const processRoom = async () => {
    if (!originalImage) return;

    setIsLoading(true);
    setError(null);
    try {
      const optimizedImage = await resizeImage(originalImage);
      const base64Data = optimizedImage.split(',')[1];

      setStatus('Syncing with Gemini spatial agents...');
      const analysisResult = await analyzeRoom(base64Data);
      setAnalysis(analysisResult);

      setStatus('Visioning your redesigned aura...');
      const redesignedUrl = await generateRedesignedRoom(base64Data, analysisResult.analysis);
      setRedesignedImage(redesignedUrl);
      
      setStatus('Success!');
    } catch (err: any) {
      console.error("Workflow failure:", err);
      setError(err.message || 'An unexpected error occurred during spatial reconstruction.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-accent selection:text-black">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center border-b border-white/5 bg-paper/60 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl ai-gradient flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.3)]">
            <Cpu className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter glow-text leading-none mt-1">AURA AI</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-accent opacity-80">Spatial Optimization Engine</p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-ink/40">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Gemini 2.5 Flash Online
          </div>
        </div>
      </header>

      <main className="pt-28 pb-12 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {!originalImage ? (
            <motion.section
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-12"
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-block px-4 py-1.5 glass rounded-full text-[10px] uppercase tracking-[0.3em] text-accent font-black shadow-[0_0_15px_rgba(0,242,255,0.1)] mb-4"
                >
                  Spatial Awareness Technology
                </motion.div>
                <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] uppercase">
                  Level up your <br />
                  <span className="text-transparent bg-clip-text ai-gradient glow-text">Aura</span>
                </h2>
                <p className="text-lg opacity-40 max-w-xl mx-auto font-medium tracking-tight">
                  Our advanced engine reconstructs your room for peak performance and aesthetics.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-4 ai-gradient text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,242,255,0.3)]"
                >
                  Initialize Scan
                </button>
                <button
                  onClick={startCamera}
                  className="px-8 py-4 glass text-ink font-bold uppercase text-xs tracking-[0.2em] rounded-xl hover:bg-white/10 active:scale-95 transition-all"
                >
                  Live Aperture
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              {showCamera && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6">
                   <div className="relative w-full max-w-4xl aspect-[4/3] rounded-[40px] overflow-hidden glass shadow-2xl">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 scanner-line pointer-events-none opacity-40" />
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-6">
                      <button 
                        onClick={capturePhoto}
                        className="w-20 h-20 rounded-full border-4 border-white/20 p-2 active:scale-90 transition-transform"
                      >
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full border-2 border-black/10" />
                        </div>
                      </button>
                      <button 
                        onClick={stopCamera}
                        className="px-8 py-2 glass text-white rounded-2xl text-xs font-black uppercase tracking-widest self-center"
                      >
                        Abort
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.section>
          ) : (
            <motion.section
              key="workbench"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-8"
            >
              <div className="md:col-span-8 space-y-6">
                <div className="relative aspect-[16/10] rounded-[32px] overflow-hidden glass shadow-2xl group">
                  <img 
                    src={redesignedImage || originalImage} 
                    alt="Scan Result" 
                    className={`w-full h-full object-cover transition-all duration-1000 ${isLoading ? 'opacity-30 blur-xl scale-110' : 'opacity-100 scale-100'}`}
                    referrerPolicy="no-referrer"
                  />
                  
                  {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="scanner-line" />
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center space-y-4"
                      >
                        <div className="w-16 h-16 rounded-2xl ai-gradient flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(0,242,255,0.4)]">
                          <RefreshCw className="w-8 h-8 text-black animate-spin" />
                        </div>
                        <div>
                          <p className="text-xl font-black uppercase tracking-[0.2em] text-accent glow-text">{status}</p>
                          <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold mt-2">Decluttering & Professional Spatial Reconstruction...</p>
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                      {!redesignedImage && (
                         <div className="absolute inset-0 p-8 pointer-events-none opacity-40">
                           <div className="bounding-box" style={{ top: '30%', left: '10%', width: '30%', height: '40%' }}>
                             <span className="furniture-label">Object Detected</span>
                           </div>
                           <div className="bounding-box border-dashed border-white/20" style={{ top: '20%', right: '10%', width: '25%', height: '50%' }}>
                             <span className="furniture-label !bg-white/10 !text-white/60">Target Zone</span>
                           </div>
                         </div>
                      )}
                    </>
                  )}

                  {!isLoading && redesignedImage && (
                    <div className="absolute bottom-8 right-8 flex gap-3">
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = redesignedImage;
                          link.download = `AuraRoom_Redesign_${Date.now()}.png`;
                          link.click();
                        }}
                        className="px-6 py-3 glass rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                      <button 
                        onClick={() => setRedesignedImage(null)}
                        className="px-6 py-3 glass rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                      >
                        Source File
                      </button>
                      <button 
                        className="px-6 py-3 ai-gradient text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,242,255,0.4)] cursor-default"
                      >
                        Optimized View
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {!redesignedImage && !isLoading && (
                    <button
                      onClick={processRoom}
                      className="col-span-2 py-6 ai-gradient text-black rounded-[24px] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4 shadow-[0_0_40px_rgba(0,242,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <Cpu className="w-6 h-6" />
                      Optimize Spatial Grid
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setOriginalImage(null);
                      resetState();
                    }}
                    className="py-5 glass text-ink rounded-[24px] font-bold uppercase tracking-widest text-xs hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    Reset Environment
                  </button>
                  {redesignedImage && (
                    <button
                      className="py-5 bg-white text-black rounded-[24px] font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <Maximize2 className="w-4 h-4" />
                      Expand Manifest
                    </button>
                  )}
                </div>
              </div>

                <div className="md:col-span-4 flex flex-col gap-6">
                  {error && (
                    <div className="p-6 glass border-red-500/20 rounded-3xl bg-red-500/5 backdrop-blur-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="p-2 rounded-xl bg-red-500/20">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-500/80">Diagnostic Error</p>
                        <p className="text-xs font-semibold leading-relaxed opacity-90">{error}</p>
                        <div className="flex gap-4 mt-2">
                          <button 
                            onClick={processRoom}
                            className="text-[10px] uppercase font-black tracking-widest text-accent hover:underline flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Retry optimization
                          </button>
                          <button 
                            onClick={() => setError(null)}
                            className="text-[10px] uppercase font-black tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                          >
                            Clear Log
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="glass rounded-[32px] p-8 flex flex-col h-full min-h-[400px]">
                  <div className="mb-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-2">Telemetry Results</h3>
                    <h4 className="text-3xl font-black tracking-tighter uppercase leading-none">
                      {analysis ? "Grid Optimization" : "Awaiting Data"}
                    </h4>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {analysis ? (
                      analysis.recommendations.map((rec, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-5 rounded-2xl glass border-white/5 space-y-3 relative overflow-hidden group"
                        >
                          <div className="flex justify-between items-start relative z-10">
                            <div>
                              <span className="block text-[10px] font-mono text-white/30 uppercase mb-1">ID: 0{i+1}</span>
                              <span className="font-bold text-lg leading-none uppercase tracking-tighter">{rec.item}</span>
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-accent" />
                          </div>
                          <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                             <p className="text-[10px] uppercase font-black text-accent tracking-widest mb-1">Vector Translation</p>
                             <p className="text-xs font-medium opacity-80">{rec.suggestedPosition}</p>
                          </div>
                          <p className="text-[11px] opacity-40 font-medium leading-relaxed italic pr-4">
                            "{rec.reason}"
                          </p>
                        </motion.div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/5 rounded-3xl">
                        <Cpu className="w-12 h-12 text-ink/10 mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest opacity-20">Initialize scan to populate telemetry data.</p>
                      </div>
                    )}
                  </div>

                  {analysis && (
                    <div className="mt-8 pt-8 border-t border-white/5">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Efficiency Score</span>
                        <span className="text-xs font-mono font-black text-accent">98.2%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full ai-gradient shadow-[0_0_10px_rgba(0,242,255,0.5)]" style={{ width: '98%' }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-8 glass rounded-[32px] border-accent/20 border-dashed relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-3xl rounded-full" />
                   <p className="text-[10px] font-black uppercase text-accent tracking-[0.3em] mb-3">Cognitive Directive</p>
                   <p className="text-xs font-medium opacity-60 leading-relaxed italic">
                     {analysis?.analysis || "Input room visual to begin spatial optimization. High-fidelity image reconstruction may take up to 60 seconds depending on your connection."}
                   </p>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="px-6 py-16 border-t border-white/5 bg-black/40 backdrop-blur-3xl min-h-[300px] flex items-end">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-12 items-end">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-accent" />
              </div>
              <span className="font-bold tracking-tighter text-lg uppercase glow-text">AURA AI</span>
            </div>
            <p className="text-[10px] font-medium text-white/20 uppercase tracking-[0.2em] leading-relaxed">
              Decentralized interior redesign engine powered by Gemini spatial awareness agents.
            </p>
          </div>
          <div className="flex justify-center gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
            <a href="#" className="hover:text-accent transition-colors">Protocols</a>
            <a href="#" className="hover:text-accent transition-colors">Archive</a>
            <a href="#" className="hover:text-accent transition-colors">Status</a>
          </div>
          <div className="text-right space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">System Time: 2026.04.21</p>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">© Aura Systems. Level-0 Access Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
