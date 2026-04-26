export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-[#1F2937]/30 bg-gradient-to-b from-[#111827]/50 to-[#0B1220]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 mb-8"> */}
          {/* <div>
            <h3 className="text-sm font-semibold text-[#E5E7EB] uppercase tracking-wider">Product</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#9CA3AF]">
              <li><a href="#" className="hover:text-[#22D3EE] transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-[#22D3EE] transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-[#22D3EE] transition-colors">Security</a></li>
            </ul>
          </div> */}
          {/* <div>
            <h3 className="text-sm font-semibold text-[#E5E7EB] uppercase tracking-wider">Company</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#9CA3AF]">
              <li><a href="#" className="hover:text-[#22D3EE] transition-colors">About</a></li>
              <li><a href="#" className="hover:text-[#22D3EE] transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-[#22D3EE] transition-colors">Careers</a></li>
            </ul>
          </div> */}
          {/* <div>
            <h3 className="text-sm font-semibold text-[#E5E7EB] uppercase tracking-wider">Legal</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#9CA3AF]">
              <li><a href="#" className="hover:text-[#22D3EE] transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-[#22D3EE] transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-[#22D3EE] transition-colors">Cookies</a></li>
            </ul>
          </div> */}
          {/* <div>
            <h3 className="text-sm font-semibold text-[#E5E7EB] uppercase tracking-wider">Contact</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#9CA3AF]">
              <li><a href="mailto:info@neurovox.com" className="hover:text-[#22D3EE] transition-colors">info@neurovox.com</a></li>
              <li><a href="tel:+1234567890" className="hover:text-[#22D3EE] transition-colors">+1 (234) 567-890</a></li>
            </ul>
          </div> */}
        {/* </div> */}

        <div className="border-t border-[#1F2937]/30 pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#6B7280]">
              &copy; {currentYear} NeuroVox. All rights reserved.
            </p>
            <p className="text-xs text-[#6B7280]">
              NeuroVox is a screening tool only. Not a medical diagnosis. Consult healthcare professionals.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
