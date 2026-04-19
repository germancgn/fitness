"use client";

import { saveProfile } from "@/app/actions/profile";
import { useState } from "react";

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState({
    gender: "",
    age: "",
    height: "",
    weight: "",
    goalType: "",
    activityLevel: "",
  });

  function update(field: string, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function next() {
    setStep((s) => (s + 1) as Step);
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1.5 mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-white" : "bg-zinc-800"}`}
              />
            ))}
          </div>
          <h1 className="text-xl font-semibold text-white">
            {step === 1 && "Tell us about yourself"}
            {step === 2 && "What's your goal?"}
            {step === 3 && "How active are you?"}
          </h1>
          <p className="text-sm text-zinc-500">
            {step === 1 && "We use this to calculate your daily calorie needs."}
            {step === 2 && "This shapes your calorie and macro targets."}
            {step === 3 && "Your activity level affects your total daily burn."}
          </p>
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-500 uppercase tracking-wide">
                Gender
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["male", "female", "other"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => update("gender", g)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
                      data.gender === g
                        ? "bg-white text-black border-white"
                        : "bg-transparent text-white border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <Field
              label="Age"
              placeholder="25"
              value={data.age}
              onChange={(v) => update("age", v)}
              type="number"
              unit="yrs"
            />
            <Field
              label="Height"
              placeholder="175"
              value={data.height}
              onChange={(v) => update("height", v)}
              type="number"
              unit="cm"
            />
            <Field
              label="Weight"
              placeholder="75"
              value={data.weight}
              onChange={(v) => update("weight", v)}
              type="number"
              unit="kg"
            />

            <button
              type="button"
              disabled={
                !data.gender || !data.age || !data.height || !data.weight
              }
              onClick={next}
              className="w-full bg-white text-black font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {[
                {
                  value: "lose_weight",
                  label: "Lose weight",
                  desc: "Calorie deficit",
                },
                {
                  value: "maintain",
                  label: "Maintain weight",
                  desc: "Stay at current weight",
                },
                {
                  value: "gain_muscle",
                  label: "Gain muscle",
                  desc: "Calorie surplus",
                },
              ].map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => update("goalType", g.value)}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    data.goalType === g.value
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-white border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <p className="text-sm font-medium">{g.label}</p>
                  <p
                    className={`text-xs mt-0.5 ${data.goalType === g.value ? "text-zinc-600" : "text-zinc-500"}`}
                  >
                    {g.desc}
                  </p>
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={!data.goalType}
              onClick={next}
              className="w-full bg-white text-black font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <form action={saveProfile} className="flex flex-col gap-4">
            <input type="hidden" name="gender" value={data.gender} />
            <input type="hidden" name="age" value={data.age} />
            <input type="hidden" name="height" value={data.height} />
            <input type="hidden" name="weight" value={data.weight} />
            <input type="hidden" name="goalType" value={data.goalType} />

            <div className="flex flex-col gap-2">
              {[
                {
                  value: "sedentary",
                  label: "Sedentary",
                  desc: "Little or no exercise",
                },
                {
                  value: "light",
                  label: "Lightly active",
                  desc: "1–3 days/week",
                },
                {
                  value: "moderate",
                  label: "Moderately active",
                  desc: "3–5 days/week",
                },
                {
                  value: "active",
                  label: "Very active",
                  desc: "6–7 days/week",
                },
                {
                  value: "very_active",
                  label: "Extra active",
                  desc: "Physical job + training",
                },
              ].map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => update("activityLevel", a.value)}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    data.activityLevel === a.value
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-white border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <p className="text-sm font-medium">{a.label}</p>
                  <p
                    className={`text-xs mt-0.5 ${data.activityLevel === a.value ? "text-zinc-600" : "text-zinc-500"}`}
                  >
                    {a.desc}
                  </p>
                </button>
              ))}
            </div>

            <input
              type="hidden"
              name="activityLevel"
              value={data.activityLevel}
            />
            <button
              type="submit"
              disabled={!data.activityLevel}
              className="w-full bg-white text-black font-medium rounded-lg px-4 py-2.5 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Finish setup
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type,
  unit,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  unit: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-zinc-500 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600 transition-colors pr-12"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
          {unit}
        </span>
      </div>
    </div>
  );
}
