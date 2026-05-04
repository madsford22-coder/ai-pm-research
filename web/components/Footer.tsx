import SubscribeForm from './SubscribeForm';

export default function Footer() {
  return (
    <footer className="border-t border-[#e7e3dd] dark:border-[#2e2b24] mt-16 px-4 sm:px-6 lg:px-8 py-10 bg-[#faf8f5] dark:bg-[#18160f]">
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#78716c] dark:text-[#a8a29e] mb-3">Stay in the loop</p>
          <SubscribeForm />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#78716c] dark:text-[#a8a29e] mb-3">Connect</p>
          <div className="space-y-2">
            <a
              href="/feedback"
              className="flex items-center gap-2 text-sm text-[#78716c] dark:text-[#a8a29e] hover:text-[#5a7a3a] dark:hover:text-[#8db870] transition-colors"
            >
              Share feedback →
            </a>
            <a
              href="mailto:hello@madisoncford.com"
              className="flex items-center gap-2 text-sm text-[#78716c] dark:text-[#a8a29e] hover:text-[#5a7a3a] dark:hover:text-[#8db870] transition-colors"
            >
              Say hello
            </a>
            <a
              href="https://www.linkedin.com/in/madison-ford-31897872/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[#78716c] dark:text-[#a8a29e] hover:text-[#5a7a3a] dark:hover:text-[#8db870] transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>

      </div>
      <div className="max-w-4xl mx-auto mt-8 pt-6 border-t border-[#e7e3dd] dark:border-[#2e2b24]">
        <p className="text-xs text-[#a8a29e]">Madison&apos;s Morning Memo · Daily AI PM signals</p>
      </div>
    </footer>
  );
}
