import React from 'react'

const values = [
  {
    title: 'Mission',
    text: 'Empower students to innovate, build, and lead as future computer engineers.',
  },
  {
    title: 'Vision',
    text: 'A stronger tech community where learners thrive through education and leadership.',
  },
  {
    title: 'Goals',
    text: 'Develop skills through projects, events, and hands-on learning opportunities.',
  },

]

export default function ICPEPValuesSection() {
  return (
    <section className="bg-slate-950">
      {/* Full-viewport background */}
      <div className="relative min-h-[85vh] w-full overflow-hidden">
        <img
          src="/groufie.jpg"
          alt="ICPEP Groufie"
          className="absolute inset-0 h-full w-full object-contain md:object-cover"
        />


        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-slate-950/60" />

        <div className="relative mx-auto flex min-h-[80vh] max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
          {/* Title at the bottom area */}
          <div className="flex-1" />

          <h2 className="mb-6 text-center text-3xl font-black tracking-tight text-white sm:mb-8 sm:text-5xl">
            Our Mission, Vision and Goals
            <span className="text-cyan-300">...</span>
          </h2>

          {/* Boxes overlay: 1 row, 3 cols on desktop; responsive on smaller screens */}
          <div className="pb-10 sm:pb-14">
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-3 md:grid-cols-1">
              {values.map((v) => (

                <div
                  key={v.title}
                  className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur"
                  style={{
                    boxShadow:
                      '0 20px 60px rgba(2,6,23,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="text-lg font-extrabold tracking-wide text-cyan-200">
                    {v.title}
                  </div>
                  <div className="mt-2 text-sm leading-relaxed text-white/80 sm:text-base">
                    {v.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Gentle bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950/95 to-transparent" />
      </div>
    </section>
  )
}


