import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './DocsPage.css'

function DocsPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('overview')
  const [openFaq, setOpenFaq] = useState(null)

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'metrics', label: 'Metrics Explained' },
    { id: 'scores', label: 'Understanding Scores' },
    { id: 'issues', label: 'Common Issues' },
    { id: 'settings', label: 'Settings Guide' },
    { id: 'faq', label: 'FAQ' }
  ]

  const metrics = [
    {
      abbr: 'LCP',
      name: 'Largest Contentful Paint',
      description: 'Measures loading performance. LCP reports the render time of the largest image or text block visible within the viewport, relative to when the page first started loading.',
      good: '≤ 2.5s',
      moderate: '2.5s - 4.0s',
      poor: '> 4.0s',
      tips: [
        'Optimize and compress images',
        'Use a CDN for faster delivery',
        'Preload critical resources',
        'Remove render-blocking resources'
      ]
    },
    {
      abbr: 'FCP',
      name: 'First Contentful Paint',
      description: 'Measures the time from when the page starts loading to when any part of the page\'s content is rendered on screen. This could be text, images, SVG, or canvas elements.',
      good: '≤ 1.8s',
      moderate: '1.8s - 3.0s',
      poor: '> 3.0s',
      tips: [
        'Eliminate render-blocking resources',
        'Minify CSS and JavaScript',
        'Remove unused CSS',
        'Use efficient cache policies'
      ]
    },
    {
      abbr: 'CLS',
      name: 'Cumulative Layout Shift',
      description: 'Measures visual stability. CLS quantifies how much visible content shifted in the viewport as well as the distance the elements impacted were shifted. CLS is a unitless score.',
      good: '≤ 0.1 (score)',
      moderate: '0.1 - 0.25 (score)',
      poor: '> 0.25 (score)',
      tips: [
        'Always include size attributes on images and videos',
        'Reserve space for ad slots',
        'Avoid inserting content above existing content',
        'Use transform animations instead of layout-triggering properties'
      ]
    },
    {
      abbr: 'TBT',
      name: 'Total Blocking Time',
      description: 'Measures the total amount of time between FCP and Time to Interactive where the main thread was blocked long enough to prevent input responsiveness.',
      good: '≤ 200ms',
      moderate: '200ms - 600ms',
      poor: '> 600ms',
      tips: [
        'Break up long tasks into smaller chunks',
        'Optimize JavaScript execution',
        'Remove unused JavaScript',
        'Use web workers for heavy computations'
      ]
    },
    {
      abbr: 'SI',
      name: 'Speed Index',
      description: 'Measures how quickly content is visually displayed during page load. It captures the visual progression of loading and computes an overall score.',
      good: '≤ 3.4s',
      moderate: '3.4s - 5.8s',
      poor: '> 5.8s',
      tips: [
        'Minimize main thread work',
        'Reduce JavaScript execution time',
        'Ensure text remains visible during webfont load',
        'Optimize critical rendering path'
      ]
    },
    {
      abbr: 'TTFB',
      name: 'Time to First Byte',
      description: 'Measures the time from when the user\'s browser requests a page until the first byte of information is received from the server.',
      good: '≤ 800ms',
      moderate: '800ms - 1800ms',
      poor: '> 1800ms',
      tips: [
        'Use a CDN to reduce latency',
        'Optimize server response time',
        'Enable compression (gzip/brotli)',
        'Use HTTP/2 or HTTP/3'
      ]
    }
  ]

  const faqs = [
    {
      q: 'How accurate are the results compared to Google Lighthouse?',
      a: 'RenderIQ uses similar methodology to Lighthouse, measuring real browser performance with Playwright. Results may vary slightly due to network conditions, server response times, and testing environment. For the most accurate comparison, run multiple tests and average the results.'
    },
    {
      q: 'Why is my score different each time I test?',
      a: 'Performance varies due to network conditions, server load, CDN caching, and other factors. This is normal and expected. Run 3-5 tests and consider the average for a more reliable assessment.'
    },
    {
      q: 'What does the authentication feature do?',
      a: 'The authentication feature allows you to analyze pages that require login. It exports your session cookies, localStorage, and sessionStorage from a logged-in browser session, then injects them into our testing browser to access protected pages.'
    },
    {
      q: 'Is my data secure when using authentication?',
      a: 'Session data is only used for the current analysis and is never stored on our servers. The browser instance is destroyed immediately after each test. We recommend using the authentication feature only for development/staging environments.'
    },
    {
      q: 'What is the difference between Fast, 4G, and Slow network options?',
      a: 'Fast (WiFi) tests at full speed with no throttling. 4G simulates a typical mobile connection (~4 Mbps download). Slow (3G) simulates poor network conditions (~1.5 Mbps). Use 4G or Slow to understand how your site performs for users on mobile networks.'
    },
    {
      q: 'Why is LCP showing as N/A?',
      a: 'LCP requires a significant content element (image, video, or text block) to be rendered. If your page has minimal content above the fold, or uses heavy JavaScript rendering, LCP may not be captured. This can also happen if the page loads too quickly.'
    },
    {
      q: 'How is the overall score calculated?',
      a: 'The score is calculated using weighted metrics: TBT (30%), LCP (25%), CLS (25%), FCP (10%), Speed Index (10%). Each metric is scored based on Google\'s performance thresholds, then combined into a final 0-100 score.'
    },
    {
      q: 'Can I test localhost or internal URLs?',
      a: 'Currently, RenderIQ can only test publicly accessible URLs. For localhost testing, you would need to expose your local server using tools like ngrok or deploy to a staging environment.'
    }
  ]

  const scrollToSection = (id) => {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="docs-page">
      <header className="docs-header">
        <div className="docs-header-content">
          <button className="back-btn" onClick={() => navigate('/')}>
            <BackIcon /> Back to Home
          </button>
          <h1>RenderIQ Documentation</h1>
          <p>Everything you need to understand your performance reports</p>
        </div>
      </header>

      <div className="docs-container">
        <nav className="docs-nav">
          <div className="docs-nav-content">
            <h3>Contents</h3>
            <ul>
              {sections.map(section => (
                <li key={section.id}>
                  <button
                    className={activeSection === section.id ? 'active' : ''}
                    onClick={() => scrollToSection(section.id)}
                  >
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <main className="docs-content">
          <section id="overview" className="docs-section">
            <h2>Overview</h2>
            <div className="section-content">
              <p>
                <strong>RenderIQ</strong> is a web performance analysis tool that measures how fast your website loads and identifies opportunities for improvement. Using real browser testing powered by Playwright, we capture the same metrics that Google uses to evaluate page experience.
              </p>
              
              <div className="info-box">
                <InfoIcon />
                <div>
                  <strong>Why Performance Matters</strong>
                  <p>Studies show that 53% of mobile users abandon sites that take over 3 seconds to load. Better performance leads to higher engagement, conversions, and SEO rankings.</p>
                </div>
              </div>

              <h3>What We Measure</h3>
              <ul>
                <li><strong>Core Web Vitals</strong> - LCP and CLS (the metrics Google uses for ranking)</li>
                <li><strong>Performance Metrics</strong> - FCP, Speed Index, TBT, TTFB</li>
                <li><strong>Resource Analysis</strong> - JavaScript, CSS, images, and network requests</li>
                <li><strong>Actionable Issues</strong> - Specific problems with fix recommendations</li>
              </ul>
            </div>
          </section>

          <section id="metrics" className="docs-section">
            <h2>Metrics Explained</h2>
            <div className="section-content">
              <p>Understanding each metric helps you prioritize improvements effectively.</p>
              
              <div className="metrics-grid">
                {metrics.map(metric => (
                  <div key={metric.abbr} className="metric-doc-card">
                    <div className="metric-doc-header">
                      <span className="metric-abbr">{metric.abbr}</span>
                      <span className="metric-name">{metric.name}</span>
                    </div>
                    <p className="metric-description">{metric.description}</p>
                    <div className="metric-thresholds">
                      <div className="threshold good">
                        <span className="threshold-label">Good</span>
                        <span>{metric.good}</span>
                      </div>
                      <div className="threshold moderate">
                        <span className="threshold-label">Moderate</span>
                        <span>{metric.moderate}</span>
                      </div>
                      <div className="threshold poor">
                        <span className="threshold-label">Poor</span>
                        <span>{metric.poor}</span>
                      </div>
                    </div>
                    <div className="metric-tips">
                      <h4>How to Improve</h4>
                      <ul>
                        {metric.tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="scores" className="docs-section">
            <h2>Understanding Scores</h2>
            <div className="section-content">
              <p>The overall performance score is calculated using a weighted formula based on Google Lighthouse methodology.</p>
              
              <div className="score-ranges">
                <div className="score-range good">
                  <div className="score-indicator">
                    <span className="dot"></span>
                    <span>Good (90-100)</span>
                  </div>
                  <p>Your page performs well. Keep monitoring for regressions.</p>
                </div>
                <div className="score-range moderate">
                  <div className="score-indicator">
                    <span className="dot"></span>
                    <span>Moderate (50-89)</span>
                  </div>
                  <p>There are opportunities for improvement. Focus on the highest-impact issues.</p>
                </div>
                <div className="score-range poor">
                  <div className="score-indicator">
                    <span className="dot"></span>
                    <span>Poor (0-49)</span>
                  </div>
                  <p>Significant performance issues detected. Prioritize critical fixes immediately.</p>
                </div>
              </div>

              <h3>Metric Weights</h3>
              <p>Each metric contributes differently to the overall score:</p>
              <div className="weights-table">
                <div className="weight-row">
                  <span>Total Blocking Time (TBT)</span>
                  <span className="weight">30%</span>
                </div>
                <div className="weight-row">
                  <span>Largest Contentful Paint (LCP)</span>
                  <span className="weight">25%</span>
                </div>
                <div className="weight-row">
                  <span>Cumulative Layout Shift (CLS)</span>
                  <span className="weight">25%</span>
                </div>
                <div className="weight-row">
                  <span>First Contentful Paint (FCP)</span>
                  <span className="weight">10%</span>
                </div>
                <div className="weight-row">
                  <span>Speed Index (SI)</span>
                  <span className="weight">10%</span>
                </div>
              </div>
            </div>
          </section>

          <section id="issues" className="docs-section">
            <h2>Common Issues & Fixes</h2>
            <div className="section-content">
              <p>Here are the most common performance issues and how to resolve them.</p>
              
              <div className="issues-list">
                <div className="issue-doc-card">
                  <div className="issue-header">
                    <span className="issue-severity critical">critical</span>
                    <h4>Reduce unused JavaScript</h4>
                  </div>
                  <p>Remove JavaScript that is loaded but never used. This reduces network activity and parsing time.</p>
                  <div className="issue-solution">
                    <strong>Solution:</strong> Use code splitting, tree shaking, and lazy loading. Audit your bundles with tools like webpack-bundle-analyzer.
                  </div>
                </div>

                <div className="issue-doc-card">
                  <div className="issue-header">
                    <span className="issue-severity critical">critical</span>
                    <h4>Eliminate render-blocking resources</h4>
                  </div>
                  <p>Resources like CSS and synchronous JavaScript block the browser from rendering content.</p>
                  <div className="issue-solution">
                    <strong>Solution:</strong> Inline critical CSS, defer non-critical CSS, and use async/defer for scripts.
                  </div>
                </div>

                <div className="issue-doc-card">
                  <div className="issue-header">
                    <span className="issue-severity warning">warning</span>
                    <h4>Optimize images</h4>
                  </div>
                  <p>Large, unoptimized images significantly slow down page load.</p>
                  <div className="issue-solution">
                    <strong>Solution:</strong> Use modern formats (WebP, AVIF), compress images, implement lazy loading, and serve responsive images.
                  </div>
                </div>

                <div className="issue-doc-card">
                  <div className="issue-header">
                    <span className="issue-severity warning">warning</span>
                    <h4>Reduce unused CSS</h4>
                  </div>
                  <p>CSS files often contain rules that are never used on the current page.</p>
                  <div className="issue-solution">
                    <strong>Solution:</strong> Use tools like PurgeCSS to remove unused styles. Consider CSS-in-JS or CSS modules.
                  </div>
                </div>

                <div className="issue-doc-card">
                  <div className="issue-header">
                    <span className="issue-severity info">info</span>
                    <h4>Serve static assets with efficient cache policy</h4>
                  </div>
                  <p>Without proper caching, browsers re-download resources on every visit.</p>
                  <div className="issue-solution">
                    <strong>Solution:</strong> Set appropriate Cache-Control headers. Use content hashing for cache busting.
                  </div>
                </div>

                <div className="issue-doc-card">
                  <div className="issue-header">
                    <span className="issue-severity info">info</span>
                    <h4>Minify JavaScript and CSS</h4>
                  </div>
                  <p>Minification removes whitespace, comments, and shortens variable names.</p>
                  <div className="issue-solution">
                    <strong>Solution:</strong> Use build tools like webpack, Vite, or esbuild with minification enabled.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="settings" className="docs-section">
            <h2>Settings Guide</h2>
            <div className="section-content">
              <h3>Device Options</h3>
              <div className="settings-grid">
                <div className="setting-card">
                  <DesktopIcon />
                  <h4>Desktop</h4>
                  <p>Tests with a 1350×940 viewport and desktop user agent. Use this to see how your site performs on typical desktop computers.</p>
                </div>
                <div className="setting-card">
                  <MobileIcon />
                  <h4>Mobile</h4>
                  <p>Tests with a 412×915 viewport (Pixel 5) and mobile user agent. Critical for understanding mobile user experience.</p>
                </div>
              </div>

              <h3>Network Options</h3>
              <div className="settings-grid three">
                <div className="setting-card">
                  <h4>Fast</h4>
                  <p>No throttling. Tests at your actual network speed. Use for baseline measurements.</p>
                </div>
                <div className="setting-card">
                  <h4>4G</h4>
                  <p>Simulates typical 4G mobile connection (~4 Mbps download). Good for testing mobile performance.</p>
                </div>
                <div className="setting-card">
                  <h4>Slow</h4>
                  <p>Simulates 3G connection (~1.5 Mbps). Tests worst-case scenarios for users on slow networks.</p>
                </div>
              </div>

              <h3>Authentication</h3>
              <p>To analyze pages that require login:</p>
              <ol>
                <li>Enable "Page requires authentication" toggle</li>
                <li>Drag the "Export Session" bookmarklet to your bookmarks bar</li>
                <li>Log into your website normally</li>
                <li>Click the bookmarklet - it will copy your session data</li>
                <li>Paste the data in RenderIQ and run the analysis</li>
              </ol>
              <div className="info-box warning">
                <AlertIcon />
                <p>Session data is only used for the current analysis and is not stored. The browser instance is destroyed after each test.</p>
              </div>
            </div>
          </section>

          <section id="faq" className="docs-section">
            <h2>Frequently Asked Questions</h2>
            <div className="section-content">
              <div className="faq-list">
                {faqs.map((faq, index) => (
                  <div key={index} className="faq-item">
                    <button
                      className={`faq-question ${openFaq === index ? 'open' : ''}`}
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    >
                      <span>{faq.q}</span>
                      <ChevronIcon />
                    </button>
                    {openFaq === index && (
                      <div className="faq-answer">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

// Icons
function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <path d="M12 9v4M12 17h.01"/>
    </svg>
  )
}

function DesktopIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
    </svg>
  )
}

function MobileIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <path d="M12 18h.01"/>
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  )
}

export default DocsPage
