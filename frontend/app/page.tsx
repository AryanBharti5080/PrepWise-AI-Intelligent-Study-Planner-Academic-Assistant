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
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between border-b border-slate-800 px-6 py-5 md:px-12">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-blue-500"
        >
          PrepWise AI
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Register
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto flex min-h-[calc(100vh-81px)] max-w-6xl flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
          <Sparkles size={15} />
          AI-Powered Academic Assistant
        </div>

        <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight md:text-7xl">
          Study smarter with{" "}
          <span className="text-blue-500">PrepWise AI</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400 md:text-xl">
          Create personalized study plans, organize your preparation,
          track your progress, and get AI-powered career guidance.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/register"
            className="group flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-700"
          >
            Get Started
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>

          <Link
            href="/login"
            className="rounded-xl border border-slate-700 bg-slate-900 px-8 py-4 font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
          >
            I Already Have an Account
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid w-full max-w-4xl gap-5 md:grid-cols-3">
          <FeatureCard
            icon={<BrainCircuit size={21} />}
            title="AI Study Planner"
            description="Generate personalized study schedules based on your syllabus and exam date."
          />

          <FeatureCard
            icon={<BookOpenCheck size={21} />}
            title="Saved Study Plans"
            description="Keep your generated plans organized and access them whenever you need."
          />

          <FeatureCard
            icon={<BriefcaseBusiness size={21} />}
            title="Career Assistant"
            description="Explore suitable career roles, skills, certifications, and beginner projects."
          />
        </div>
      </section>

      {/* About PrepWise */}
      <section className="border-t border-slate-800 bg-slate-950 px-6 py-24 md:px-12">
        <div className="mx-auto max-w-6xl">

          {/* Section Heading */}
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">
              <BrainCircuit size={16} className="text-blue-500" />
              About PrepWise AI
            </div>

            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              Your preparation,
              <span className="text-blue-500"> intelligently organized.</span>
            </h2>

            <p className="mt-6 text-base leading-8 text-slate-400 md:text-lg">
              PrepWise AI is an intelligent academic assistant designed to
              help students turn their syllabus, available study time, and
              exam deadline into a practical preparation strategy.
            </p>
          </div>

          {/* Main Product Explanation */}
          <div className="mt-16 grid gap-6 lg:grid-cols-2">

            {/* Left */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 md:p-10">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-500">
                <Sparkles size={23} />
              </div>

              <h3 className="text-2xl font-semibold">
                From syllabus to study strategy
              </h3>

              <p className="mt-4 leading-7 text-slate-400">
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
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 md:p-10">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-500">
                <Target size={23} />
              </div>

              <h3 className="text-2xl font-semibold">
                Everything you need in one place
              </h3>

              <p className="mt-4 leading-7 text-slate-400">
                PrepWise brings planning, saved preparation strategies,
                academic insights, and early career guidance into one simple
                student-focused platform.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <MiniFeature
                  icon={<BrainCircuit size={18} />}
                  title="AI Planning"
                  description="Personalized study schedules"
                />

                <MiniFeature
                  icon={<BookOpenCheck size={18} />}
                  title="Saved Plans"
                  description="Access your plans anytime"
                />

                <MiniFeature
                  icon={<BarChart3 size={18} />}
                  title="Dashboard"
                  description="Simple academic overview"
                />

                <MiniFeature
                  icon={<BriefcaseBusiness size={18} />}
                  title="Career AI"
                  description="Explore suitable career paths"
                />
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium uppercase tracking-widest text-blue-500">
                How it works
              </p>

              <h3 className="mt-3 text-3xl font-bold md:text-4xl">
                Simple inputs. Intelligent preparation.
              </h3>

              <p className="mt-4 text-slate-400">
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
          <div className="mt-24 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">
            <div className="grid lg:grid-cols-2">

              <div className="p-8 md:p-12">
                <p className="text-sm font-medium uppercase tracking-widest text-blue-500">
                  Why PrepWise?
                </p>

                <h3 className="mt-3 text-3xl font-bold md:text-4xl">
                  Built around the way students actually prepare.
                </h3>

                <p className="mt-5 leading-7 text-slate-400">
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

              <div className="border-t border-slate-800 p-8 lg:border-l lg:border-t-0 md:p-12">
                <div className="flex h-full flex-col justify-center">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                      <ShieldCheck size={22} />
                    </div>

                    <div>
                      <p className="font-semibold">
                        Designed for focused preparation
                      </p>
                      <p className="text-sm text-slate-500">
                        Simple by design
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />

                      <p className="text-sm text-slate-400">
                        PrepWise AI
                      </p>
                    </div>

                    <p className="mt-5 text-xl font-semibold leading-8">
                      Plan your preparation.
                      <br />
                      Understand your priorities.
                      <br />
                      Study with purpose.
                    </p>

                    <div className="mt-7 flex items-center gap-2 text-sm text-blue-500">
                      <Sparkles size={16} />
                      AI-powered academic assistance
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-24 text-center">
            <h3 className="text-3xl font-bold md:text-4xl">
              Ready to prepare smarter?
            </h3>

            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Create your account and let PrepWise AI turn your syllabus into
              a practical study strategy.
            </p>

            <Link
              href="/register"
              className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white transition hover:bg-blue-700"
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
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-left transition hover:-translate-y-1 hover:border-slate-700">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-500">
        {icon}
      </div>

      <h2 className="text-lg font-semibold text-white">
        {title}
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-400">
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
    <div className="flex gap-4">
      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-blue-500">
        {icon}
      </div>

      <div>
        <h4 className="font-medium text-slate-200">
          {title}
        </h4>

        <p className="mt-1 text-sm leading-6 text-slate-500">
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
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="mb-4 text-blue-500">
        {icon}
      </div>

      <h4 className="font-semibold text-slate-200">
        {title}
      </h4>

      <p className="mt-2 text-sm leading-6 text-slate-500">
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
    <div className="relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
          {icon}
        </div>

        <span className="text-sm font-semibold text-slate-700">
          {number}
        </span>
      </div>

      <h4 className="mt-6 text-lg font-semibold">
        {title}
      </h4>

      <p className="mt-3 text-sm leading-6 text-slate-500">
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
        className="shrink-0 text-blue-500"
      />

      <span className="text-sm text-slate-300">
        {text}
      </span>
    </div>
  );
}