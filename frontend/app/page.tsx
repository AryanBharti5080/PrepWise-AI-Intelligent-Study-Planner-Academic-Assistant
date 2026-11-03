import Link from "next/link";
import {
  BrainCircuit,
  CalendarDays,
  Sparkles,
  BookOpenCheck,
  BarChart3,
  BriefcaseBusiness,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Target,
  GraduationCap,
  Layers,
  BookMarked,
  Lightbulb,
} from "lucide-react";
import HomeFeedbackForm from "@/components/HomeFeedbackForm";
import ThemeToggle from "@/components/ThemeToggle";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden text-slate-900 transition-colors duration-150 dark:text-slate-100">
      {/* Dynamic Animated Educational Background */}
      <AnimatedBackground />

      {/* Navigation */}
      <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-4.5 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 md:px-12">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30 transition group-hover:scale-105">
            <GraduationCap size={20} />
          </div>
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-blue-300">
            PrepWise AI
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle variant="icon" />

          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition hover:bg-blue-700 hover:shadow-md hover:shadow-blue-500/35 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40"
          >
            Register
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto flex min-h-[calc(100vh-81px)] max-w-6xl flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-4 py-2 text-sm font-medium text-blue-700 shadow-2xs backdrop-blur-xs transition hover:border-blue-300 dark:border-blue-900/50 dark:bg-blue-950/60 dark:text-blue-300">
          <Sparkles size={15} className="text-blue-600 dark:text-blue-400 animate-pulse" />
          <span>AI-Powered Academic Assistant</span>
        </div>

        <h1 className="max-w-4xl text-5xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white md:text-7xl">
          Study smarter with{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-sky-300">
            PrepWise AI
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300 md:text-xl">
          Create personalized study plans, organize your preparation,
          track your progress, and get AI-powered career guidance.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/register"
            className="group flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-bold text-white shadow-lg shadow-blue-500/25 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:shadow-none dark:hover:bg-blue-500 dark:focus:ring-blue-900/50"
          >
            Get Started
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>

          <Link
            href="/login"
            className="rounded-xl border border-slate-300/80 bg-white/90 px-8 py-4 font-bold text-slate-700 shadow-xs backdrop-blur-xs transition duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-600 dark:focus:ring-slate-800"
          >
            I Already Have an Account
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid w-full max-w-4xl gap-5 md:grid-cols-3">
          <FeatureCard
            icon={<BrainCircuit size={22} />}
            title="AI Study Planner"
            description="Generate personalized study schedules based on your syllabus and exam date."
          />

          <FeatureCard
            icon={<BookOpenCheck size={22} />}
            title="Saved Study Plans"
            description="Keep your generated plans organized and access them whenever you need."
          />

          <FeatureCard
            icon={<BriefcaseBusiness size={22} />}
            title="Career Assistant"
            description="Explore suitable career roles, skills, certifications, and beginner projects."
          />
        </div>
      </section>

      {/* About PrepWise */}
      <section className="relative border-t border-slate-200/60 bg-white/40 px-6 py-24 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/40 md:px-12">
        <div className="mx-auto max-w-6xl">

          {/* Section Heading */}
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-2xs dark:border-blue-900/50 dark:bg-blue-950/60 dark:text-blue-300">
              <GraduationCap size={16} className="text-blue-600 dark:text-blue-400" />
              About PrepWise AI
            </div>

            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
              Your preparation,
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
                {" "}intelligently organized.
              </span>
            </h2>

            <p className="mt-6 text-base leading-8 text-slate-600 dark:text-slate-300 md:text-lg">
              PrepWise AI is an intelligent academic assistant designed to
              help students turn their syllabus, available study time, and
              exam deadline into a practical preparation strategy.
            </p>
          </div>

          {/* Main Product Explanation */}
          <div className="mt-16 grid gap-6 lg:grid-cols-2">

            {/* Left */}
            <div className="group rounded-3xl border border-slate-200/80 bg-slate-50/90 p-8 shadow-xs transition duration-300 hover:border-blue-200 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/70 dark:hover:border-slate-700 md:p-10">
              <div className="mb-8 flex h-13 w-13 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 shadow-xs transition duration-300 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white dark:border-blue-900/50 dark:bg-blue-950/60 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
                <Sparkles size={24} />
              </div>

              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                From syllabus to study strategy
              </h3>

              <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
                Instead of creating another static timetable, PrepWise uses
                your actual academic requirements to generate a study plan
                tailored to your situation.
              </p>

              <div className="mt-8 space-y-4">
                <InfoRow
                  icon={<BookOpenCheck size={18} />}
                  title="Your subjects and topics"
                  description="Tell PrepWise what you need to study."
                />

                <InfoRow
                  icon={<CalendarDays size={18} />}
                  title="Your examination date"
                  description="Set the deadline you are preparing for."
                />

                <InfoRow
                  icon={<Clock3 size={18} />}
                  title="Your available study time"
                  description="Define how many hours you can realistically study each day."
                />

                <InfoRow
                  icon={<BrainCircuit size={18} />}
                  title="AI-generated strategy"
                  description="Receive a structured plan based on your inputs."
                />
              </div>
            </div>

            {/* Right */}
            <div className="group rounded-3xl border border-slate-200/80 bg-slate-50/90 p-8 shadow-xs transition duration-300 hover:border-blue-200 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/70 dark:hover:border-slate-700 md:p-10">
              <div className="mb-8 flex h-13 w-13 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 shadow-xs transition duration-300 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white dark:border-blue-900/50 dark:bg-blue-950/60 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
                <Target size={24} />
              </div>

              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                Everything you need in one place
              </h3>

              <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
                PrepWise brings planning, saved preparation strategies,
                academic insights, and early career guidance into one simple
                student-focused platform.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <MiniFeature
                  icon={<BrainCircuit size={19} />}
                  title="AI Planning"
                  description="Personalized study schedules"
                />

                <MiniFeature
                  icon={<BookMarked size={19} />}
                  title="Saved Plans"
                  description="Access your plans anytime"
                />

                <MiniFeature
                  icon={<BarChart3 size={19} />}
                  title="Dashboard"
                  description="Simple academic overview"
                />

                <MiniFeature
                  icon={<BriefcaseBusiness size={19} />}
                  title="Career AI"
                  description="Explore suitable career paths"
                />
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                How it works
              </p>

              <h3 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white md:text-4xl">
                Simple inputs. Intelligent preparation.
              </h3>

              <p className="mt-4 text-slate-600 dark:text-slate-300">
                PrepWise keeps the entire process simple so you can focus on
                actually studying.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-4">
              <ProcessCard
                number="01"
                icon={<BookOpenCheck size={21} />}
                title="Add your syllabus"
                description="Enter your subject and the topics you need to cover."
              />

              <ProcessCard
                number="02"
                icon={<CalendarDays size={21} />}
                title="Set your deadline"
                description="Provide your examination date and available study hours."
              />

              <ProcessCard
                number="03"
                icon={<Sparkles size={21} />}
                title="Let AI plan"
                description="PrepWise generates a structured preparation strategy."
              />

              <ProcessCard
                number="04"
                icon={<CheckCircle2 size={21} />}
                title="Study with clarity"
                description="Save your plan, review it later, and stay organized."
              />
            </div>
          </div>

          {/* Why PrepWise */}
          <div className="mt-24 overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-50/70 shadow-xs transition duration-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="grid lg:grid-cols-2">

              <div className="p-8 md:p-12">
                <p className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  Why PrepWise?
                </p>

                <h3 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white md:text-4xl">
                  Built around the way students actually prepare.
                </h3>

                <p className="mt-5 leading-7 text-slate-600 dark:text-slate-300">
                  The goal is not to overwhelm students with complicated
                  productivity tools. PrepWise focuses on one thing:
                  making academic preparation easier to organize and act on.
                </p>

                <div className="mt-8 space-y-4">
                  <Benefit text="Personalized instead of generic schedules" />
                  <Benefit text="AI-assisted academic planning" />
                  <Benefit text="Securely saved study plans" />
                  <Benefit text="Simple academic dashboard" />
                  <Benefit text="Career guidance based on your interests" />
                </div>
              </div>

              <div className="border-t border-slate-200/80 p-8 lg:border-l lg:border-t-0 md:p-12 bg-white dark:border-slate-800/80 dark:bg-slate-900">
                <div className="flex h-full flex-col justify-center">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/50 shadow-2xs">
                      <ShieldCheck size={24} />
                    </div>

                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        Designed for focused preparation
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Simple by design
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-blue-50/40 p-6 shadow-2xs transition duration-300 hover:border-blue-200 dark:border-slate-800 dark:from-slate-900/90 dark:to-blue-950/20">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />

                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        PrepWise AI
                      </p>
                    </div>

                    <p className="mt-5 text-xl font-bold leading-8 text-slate-900 dark:text-white">
                      Plan your preparation.
                      <br />
                      Understand your priorities.
                      <br />
                      Study with purpose.
                    </p>

                    <div className="mt-7 flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                      <Sparkles size={16} />
                      AI-powered academic assistance
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Feedback Form Section */}
          <div className="mt-20">
            <HomeFeedbackForm />
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <div className="mx-auto mb-4 inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shadow-xs">
              <Lightbulb size={24} />
            </div>

            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white md:text-4xl">
              Ready to prepare smarter?
            </h3>

            <p className="mx-auto mt-4 max-w-xl text-slate-600 dark:text-slate-400">
              Create your account and let PrepWise AI turn your syllabus into
              a practical study strategy.
            </p>

            <Link
              href="/register"
              className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-bold text-white shadow-lg shadow-blue-500/25 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/35 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-none dark:focus:ring-blue-900"
            >
              Start Using PrepWise
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-slate-50/90 py-8 text-center text-xs text-slate-500 dark:border-slate-800/80 dark:bg-slate-950 dark:text-slate-400">
        PrepWise AI · Intelligent Study Planning and Academic Assistant
      </footer>
    </main>
  );
}


/* ---------------- Components ---------------- */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white/90 p-6 text-left shadow-xs transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/5 dark:border-slate-800/80 dark:bg-slate-900/90 dark:hover:border-blue-700/80">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 shadow-2xs transition duration-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
        {icon}
      </div>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
        {title}
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}


function InfoRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex gap-4 rounded-xl p-2 transition hover:bg-white/60 dark:hover:bg-slate-800/40">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-blue-600 shadow-2xs transition group-hover:border-blue-200 group-hover:scale-105 dark:border-slate-800 dark:bg-slate-900 dark:text-blue-400 dark:group-hover:border-slate-700">
        {icon}
      </div>

      <div>
        <h4 className="font-semibold text-slate-900 dark:text-white">
          {title}
        </h4>

        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}


function MiniFeature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90 dark:hover:border-slate-700">
      <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:scale-105 dark:bg-blue-950/60 dark:text-blue-400">
        {icon}
      </div>

      <h4 className="font-bold text-slate-900 dark:text-white">
        {title}
      </h4>

      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}


function ProcessCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-xs transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/90 dark:hover:border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 transition duration-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/60 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
          {icon}
        </div>

        <span className="text-sm font-bold text-slate-400/80 transition group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400">
          {number}
        </span>
      </div>

      <h4 className="mt-6 text-lg font-bold text-slate-900 dark:text-white">
        {title}
      </h4>

      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}


function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle2
        size={18}
        className="shrink-0 text-blue-600 dark:text-blue-400"
      />

      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {text}
      </span>
    </div>
  );
}

