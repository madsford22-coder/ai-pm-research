import Image from 'next/image';

export default function HomeHero({ latestUrl }: { latestUrl?: string }) {
  return (
    <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-[#f3f0ea] dark:bg-[#1e1c16] border border-[#e7e3dd] dark:border-[#2e2b24]">
      <div className="px-6 sm:px-10 pt-8 sm:pt-10 pb-6 sm:pb-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-8">
          <div className="shrink-0 self-start">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-2 ring-[#c8d8b8] dark:ring-[#4a6830] shadow-md">
              <Image
                src="/madison.jpeg"
                alt="Madison Ford"
                width={96}
                height={96}
                className="w-full h-full object-cover object-top"
                priority
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium tracking-widest uppercase text-[#78716c] dark:text-[#a8a29e] mb-1">
              Madison&apos;s Morning Memo
            </p>
            <p className="text-sm text-[#78716c] dark:text-[#a8a29e] mb-3">
              Daily AI PM signals
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1c1917] dark:text-[#f5f0ea] leading-snug mb-3">
              Daily AI product news and analysis for product managers building with AI.
            </h1>
            <p className="text-[15px] leading-relaxed text-[#44403c] dark:text-[#c8c4bc] mb-4">
              I filter the day&apos;s model releases, agent products, AI UX patterns and industry
              shifts into what actually matters for product teams. This is a daily AI product
              management newsletter for product managers and builders.
            </p>
            <div className="space-y-3 text-[15px] leading-relaxed text-[#44403c] dark:text-[#c8c4bc]">
              <p>
                Hi, I&apos;m Madison Ford. I&apos;m a Senior PM at Rocket Money, where I build AI products
                that help millions of people manage their finances. It&apos;s work that feels personal:
                I grew up on financial aid and know firsthand what it means to stretch a dollar.
              </p>
              <p>
                I&apos;m also deeply curious about where AI is going, but I&apos;m not on social media
                and I don&apos;t want to be. I wanted a way to stay informed without the endless scroll,
                something intentional and actually useful. So I built this.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[#ddd9d2] dark:border-[#2e2b24] flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <a
              href="mailto:madsford22@gmail.com"
              className="inline-flex items-center gap-1.5 text-sm text-[#78716c] dark:text-[#a8a29e] hover:text-[#5a7a3a] dark:hover:text-[#8db870] transition-colors"
            >
              Say hello
            </a>
            <a
              href="https://www.linkedin.com/in/madison-ford-31897872/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#78716c] dark:text-[#a8a29e] hover:text-[#5a7a3a] dark:hover:text-[#8db870] transition-colors"
            >
              LinkedIn
            </a>
          </div>
          {latestUrl && (
            <a
              href={latestUrl}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-[#5a7a3a] hover:bg-[#4a6830] text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              Today&apos;s update
            </a>
          )}
        </div>
        <p className="mt-4 text-sm text-[#78716c] dark:text-[#a8a29e]">
          Know a PM who&apos;d like this?{' '}
          <a
            href="mailto:?subject=Madison's Morning Memo&body=Daily AI product news for product managers: https://madisoncford.com"
            className="text-[#5a7a3a] dark:text-[#8db870] hover:underline"
          >
            Forward it.
          </a>
        </p>
      </div>
    </div>
  );
}
