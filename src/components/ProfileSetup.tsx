"use client";

import { useState, useRef } from "react";
import type { UserProfile } from "@/lib/types";
import {
  LIFESTYLE_INFO,
  GOAL_INFO,
  calcBMI,
  bmiCategory,
  calcDailyCalories,
  calcMacroTargets,
} from "@/lib/types";

interface ProfileSetupProps {
  dark: boolean;
  onComplete: (profile: UserProfile) => void;
  existingProfile?: UserProfile | null;
}

function resizeImage(base64: string, maxW: number, maxH: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const w = img.width;
      const h = img.height;
      const size = Math.min(w, h);
      const sx = (w - size) / 2;
      const sy = (h - size) / 2;
      canvas.width = maxW;
      canvas.height = maxH;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, maxW, maxH);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = base64;
  });
}

export function ProfileSetup({ dark, onComplete, existingProfile }: ProfileSetupProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [picturePreview, setPicturePreview] = useState<string>(existingProfile?.profilePicture || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: existingProfile?.name || "",
    age: existingProfile?.age || 25,
    gender: existingProfile?.gender || "male",
    weightKg: existingProfile?.weightKg || 70,
    heightCm: existingProfile?.heightCm || 170,
    lifestyle: existingProfile?.lifestyle || "normal",
    goal: existingProfile?.goal || "maintain",
  });

  const bmi = calcBMI(form.weightKg, form.heightCm);
  const bmiCat = bmiCategory(bmi);

  const previewProfile: UserProfile = { id: 0, ...form } as any;
  const dailyCal = calcDailyCalories(previewProfile);
  const macros = calcMacroTargets(dailyCal, form.lifestyle, form.goal);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const resized = await resizeImage(reader.result as string, 256, 256);
      setPicturePreview(resized);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, profilePicture: picturePreview || undefined }),
      });

      if (!res.ok) {
        throw new Error("Unable to save profile right now.");
      }

      const data = await res.json();
      onComplete(data);
    } catch {
      setSaveError("We could not save your profile yet. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${
      dark 
        ? "bg-[#000000] text-white" 
        : "bg-[#f5f5f5] text-gray-900"
    }`}>
      <div className="max-w-[560px] mx-auto px-4 py-12 flex flex-col min-h-screen justify-center">
        {/* Header */}
        <div className="text-center mb-10 fade-in stagger-1">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent drop-shadow-sm pb-2">
            SmartMeal India
          </h1>
          <p className={`mt-2 text-base font-medium ${dark ? "text-orange-300" : "text-primary-dark"}`}>
            {existingProfile ? "Update Your Profile" : "Let\u0027s set up your profile"}
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-3 mb-8 fade-in stagger-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2.5 rounded-full transition-all duration-700 ease-in-out ${
                s <= step
                  ? "bg-gradient-to-r from-primary to-primary-dark shadow-[0_0_10px_rgba(234,91,12,0.5)]"
                  : dark ? "bg-dark-border" : "bg-orange-200/50"
              }`}
            />
          ))}
        </div>

        <div className="fade-in stagger-3 relative">
          {/* Step 1: Basic Info + Picture */}
          {step === 1 && (
            <div className="glass-card p-8 fade-in space-y-6">
              <div className="text-center mb-4">
                <span className="text-6xl animate-float inline-block drop-shadow-md">👋</span>
                <h2 className="text-2xl font-bold mt-4">Welcome! Tell us about yourself</h2>
                <p className="text-sm opacity-60 mt-2">We&apos;ll personalize your meal plan</p>
              </div>

              {/* Profile Picture Upload */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group cursor-pointer outline-none"
                >
                  <div className={`w-28 h-28 rounded-full overflow-hidden border-4 transition-all duration-300 ${
                    dark ? "border-primary/50" : "border-primary/30"
                  } group-hover:border-primary group-hover:shadow-[0_0_20px_rgba(234,91,12,0.4)] group-hover:scale-105`}>
                    {picturePreview ? (
                      <img src={picturePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex flex-col items-center justify-center ${
                        dark ? "bg-dark-border" : "bg-gradient-to-br from-orange-100 to-orange-200"
                      }`}>
                        <span className="text-4xl opacity-80">📷</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <span className="text-white text-2xl font-bold">+</span>
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-bold opacity-70 uppercase tracking-wider ml-1">Your Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Rahul, Priya..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field mt-1.5"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold opacity-70 uppercase tracking-wider ml-1">Age</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 25 })}
                    className="input-field mt-1.5"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold opacity-70 uppercase tracking-wider ml-1">Gender</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1.5">
                    {[
                      { value: "male", icon: "👨", label: "Male" },
                      { value: "female", icon: "👩", label: "Female" },
                      { value: "other", icon: "🧑", label: "Other" },
                    ].map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setForm({ ...form, gender: g.value })}
                        className={`p-4 rounded-xl text-center transition-all duration-300 border border-transparent ${
                          form.gender === g.value
                            ? "tab-active shadow-lg"
                            : dark
                            ? "bg-dark-border text-gray-300 hover:bg-dark-card hover:border-gray-600"
                            : "bg-white/60 text-gray-700 hover:bg-white hover:border-orange-300 shadow-sm"
                        }`}
                      >
                        <span className="text-2xl block mb-1">{g.icon}</span>
                        <span className="text-sm font-semibold">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!form.name.trim()}
                className="btn-primary w-full py-4 text-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Body Measurements */}
          {step === 2 && (
            <div className="glass-card p-8 fade-in space-y-6">
              <div className="text-center mb-4">
                <span className="text-6xl animate-float inline-block drop-shadow-md">📏</span>
                <h2 className="text-2xl font-bold mt-4">Body Measurements</h2>
                <p className="text-sm opacity-60 mt-2">This helps us calculate your BMI &amp; calorie needs</p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold opacity-70 uppercase tracking-wider ml-1">Weight</label>
                    <span className="font-bold text-primary">{form.weightKg} kg</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={150}
                    step={0.5}
                    value={form.weightKg}
                    onChange={(e) => setForm({ ...form, weightKg: parseFloat(e.target.value) })}
                    className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] opacity-40 mt-1 px-1">
                    <span>30kg</span><span>150kg</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold opacity-70 uppercase tracking-wider ml-1">Height</label>
                    <span className="font-bold text-primary">{form.heightCm} cm</span>
                  </div>
                  <input
                    type="range"
                    min={120}
                    max={220}
                    step={1}
                    value={form.heightCm}
                    onChange={(e) => setForm({ ...form, heightCm: parseFloat(e.target.value) })}
                    className="w-full accent-primary h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] opacity-40 mt-1 px-1">
                    <span>120cm</span><span>220cm</span>
                  </div>
                  <p className="text-xs opacity-50 text-right mt-1 font-medium">
                    {Math.floor(form.heightCm / 30.48)}&apos;{Math.round((form.heightCm / 2.54) % 12)}&quot; ft
                  </p>
                </div>
              </div>

              {/* Live BMI Preview */}
              <div className={`rounded-xl p-5 text-center transition-all duration-300 ${dark ? "bg-dark-border" : "bg-orange-50"} border border-current/10 shadow-inner mt-4`}>
                <p className="text-xs opacity-60 uppercase tracking-wider font-bold">Your BMI</p>
                <div className="flex items-end justify-center gap-2 mt-1">
                  <p className={`text-4xl font-black ${bmiCat.color} drop-shadow-sm`}>{bmi}</p>
                </div>
                <p className={`text-sm mt-1.5 font-semibold ${bmiCat.color}`}>{bmiCat.emoji} {bmiCat.label}</p>
              </div>

              <div className="flex gap-4 pt-2">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-bold border-2 border-primary/20 hover:border-primary/50 text-primary transition-colors">
                  ← Back
                </button>
                <button onClick={() => setStep(3)} className="btn-primary flex-[2] py-3 text-lg">
                  Next Step →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Lifestyle Selection */}
          {step === 3 && (
            <div className="glass-card p-8 fade-in space-y-6">
              <div className="text-center mb-4">
                <span className="text-6xl animate-float inline-block drop-shadow-md">🎯</span>
                <h2 className="text-2xl font-bold mt-4">Your Lifestyle & Goals</h2>
                <p className="text-sm opacity-60 mt-2">How active are you in daily life?</p>
              </div>

              <div className="space-y-3">
                {Object.entries(LIFESTYLE_INFO).map(([key, info]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm({ ...form, lifestyle: key })}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-300 flex items-center gap-5 border ${
                      form.lifestyle === key
                        ? "tab-active border-transparent scale-[1.02]"
                        : dark
                        ? "bg-dark-border border-transparent text-gray-300 hover:bg-dark-card hover:border-gray-600"
                        : "bg-white/60 border-transparent text-gray-700 hover:bg-white hover:border-orange-300 shadow-sm"
                    }`}
                  >
                    <span className="text-4xl flex-shrink-0 drop-shadow-sm">{info.icon}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-base">{info.label}</p>
                      <p className={`text-xs mt-1 leading-relaxed ${form.lifestyle === key ? "opacity-90" : "opacity-60"}`}>
                        {info.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="text-xs font-bold opacity-70 uppercase tracking-wider ml-1">Your Primary Goal</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  {Object.entries(GOAL_INFO).map(([key, info]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm({ ...form, goal: key })}
                      className={`p-3 rounded-xl text-center transition-all duration-300 border ${
                        form.goal === key
                          ? "tab-active border-transparent"
                          : dark
                          ? "bg-dark-border border-transparent text-gray-300 hover:bg-dark-card hover:border-gray-600"
                          : "bg-white/60 border-transparent text-gray-600 hover:bg-white hover:border-orange-300 shadow-sm"
                      }`}
                    >
                      <span className="text-3xl block mb-1.5 drop-shadow-sm">{info.icon}</span>
                      <span className="text-xs font-bold leading-tight">{info.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-bold border-2 border-primary/20 hover:border-primary/50 text-primary transition-colors">
                  ← Back
                </button>
                <button onClick={() => setStep(4)} className="btn-primary flex-[2] py-3 text-lg">
                  See My Plan →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Summary & Confirm */}
          {step === 4 && (
            <div className="glass-card p-8 fade-in space-y-6">
              <div className="text-center mb-4">
                <span className="text-6xl animate-float inline-block drop-shadow-md">✨</span>
                <h2 className="text-2xl font-bold mt-4">Your Personalized Plan</h2>
                <p className="text-sm opacity-60 mt-2">Here&apos;s what we recommend for you, <span className="font-bold text-primary">{form.name || "friend"}</span>!</p>
              </div>

              {picturePreview && (
                <div className="flex justify-center mb-2">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-[0_0_15px_rgba(234,91,12,0.3)]">
                    <img src={picturePreview} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {/* Profile Summary */}
              <div className={`rounded-xl p-5 space-y-4 border ${dark ? "bg-dark-border border-gray-700" : "bg-white/60 border-orange-200/50"}`}>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="opacity-50 text-[10px] font-bold uppercase tracking-wider">Age</p>
                    <p className="font-black text-lg mt-1">{form.age}</p>
                  </div>
                  <div>
                    <p className="opacity-50 text-[10px] font-bold uppercase tracking-wider">Gender</p>
                    <p className="font-black text-lg mt-1 capitalize">{form.gender.charAt(0)}</p>
                  </div>
                  <div>
                    <p className="opacity-50 text-[10px] font-bold uppercase tracking-wider">Weight</p>
                    <p className="font-black text-lg mt-1">{form.weightKg}<span className="text-xs font-normal">kg</span></p>
                  </div>
                  <div>
                    <p className="opacity-50 text-[10px] font-bold uppercase tracking-wider">Height</p>
                    <p className="font-black text-lg mt-1">{form.heightCm}<span className="text-xs font-normal">cm</span></p>
                  </div>
                </div>
                <div className="flex justify-between pt-3 border-t border-current/10">
                  <div className="text-left">
                    <p className="text-[10px] opacity-50 font-bold uppercase tracking-wider">Lifestyle</p>
                    <p className="font-bold mt-1 text-sm flex items-center gap-1">
                      {LIFESTYLE_INFO[form.lifestyle]?.icon} {LIFESTYLE_INFO[form.lifestyle]?.label}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] opacity-50 font-bold uppercase tracking-wider">Goal</p>
                    <p className="font-bold mt-1 text-sm flex items-center gap-1 justify-end">
                      {GOAL_INFO[form.goal]?.icon} {GOAL_INFO[form.goal]?.label}
                    </p>
                  </div>
                </div>
              </div>

              {/* Calculated Targets */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`rounded-xl p-4 text-center shadow-lg relative overflow-hidden ${
                  bmiCat.color === "text-green-500" ? "bg-gradient-to-br from-green-400 to-green-600" : 
                  bmiCat.color === "text-blue-500" ? "bg-gradient-to-br from-blue-400 to-blue-600" : 
                  bmiCat.color === "text-yellow-500" ? "bg-gradient-to-br from-yellow-400 to-yellow-600" : 
                  "bg-gradient-to-br from-red-400 to-red-600"} text-white`}>
                  <div className="absolute inset-0 bg-white/10 opacity-50"></div>
                  <p className="text-3xl font-black relative z-10">{bmi}</p>
                  <p className="text-xs opacity-90 font-medium mt-1 relative z-10">BMI · {bmiCat.label}</p>
                </div>
                <div className="bg-gradient-to-br from-primary to-primary-dark shadow-[0_4px_15px_rgba(234,91,12,0.4)] text-white rounded-xl p-4 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:200%_200%] animate-[shine_2s_infinite]"></div>
                  <p className="text-3xl font-black relative z-10 drop-shadow-sm">{dailyCal}</p>
                  <p className="text-xs opacity-90 font-medium mt-1 relative z-10 uppercase tracking-wide">kcal / day</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md text-white rounded-xl p-3 text-center">
                  <p className="text-xl font-black">{macros.protein}g</p>
                  <p className="text-[10px] opacity-90 font-bold uppercase tracking-wider mt-1">Protein</p>
                </div>
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 shadow-md text-white rounded-xl p-3 text-center">
                  <p className="text-xl font-black">{macros.carbs}g</p>
                  <p className="text-[10px] opacity-90 font-bold uppercase tracking-wider mt-1">Carbs</p>
                </div>
                <div className="bg-gradient-to-br from-rose-400 to-rose-600 shadow-md text-white rounded-xl p-3 text-center">
                  <p className="text-xl font-black">{macros.fat}g</p>
                  <p className="text-[10px] opacity-90 font-bold uppercase tracking-wider mt-1">Fat</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setStep(3)} className="flex-1 py-4 rounded-xl font-bold border-2 border-primary/20 hover:border-primary/50 text-primary transition-colors">
                  ← Back
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="btn-primary flex-[2] py-4 text-lg pulse-glow"
                >
                  {saving ? "Saving..." : "✅ Let's Start!"}
                </button>
              </div>
              {saveError && (
                <p className="text-sm text-red-500 text-center font-medium">{saveError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
