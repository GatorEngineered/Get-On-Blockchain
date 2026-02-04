export const metadata = {
  title: "Accessibility Statement | Get On Blockchain",
  description: "Our commitment to digital accessibility for all users, including those with disabilities.",
};

export default function AccessibilityStatement() {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: "800px" }}>
        <h1>Accessibility Statement</h1>
        <p>Last updated: February 4, 2026</p>

        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '1rem 1.5rem',
          margin: '1.5rem 0'
        }}>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e40af', fontSize: '1.25rem' }}>
            Our Commitment to Accessibility
          </h2>
          <p style={{ margin: 0 }}>
            Get On Blockchain is committed to ensuring digital accessibility for people
            with disabilities. We are continually improving the user experience for
            everyone and applying the relevant accessibility standards.
          </p>
        </div>

        <h2>Conformance Status</h2>
        <p>
          The Web Content Accessibility Guidelines (WCAG) defines requirements for
          designers and developers to improve accessibility for people with disabilities.
          It defines three levels of conformance: Level A, Level AA, and Level AAA.
        </p>
        <p>
          <strong>Get On Blockchain is partially conformant with WCAG 2.1 Level AA.</strong>{" "}
          Partially conformant means that some parts of the content do not fully conform
          to the accessibility standard, and we are actively working to address these areas.
        </p>

        <h2>Accessibility Features</h2>
        <p>We have implemented the following accessibility features across our platform:</p>

        <h3>Navigation & Structure</h3>
        <ul>
          <li><strong>Skip to main content:</strong> Skip links allow keyboard users to bypass navigation menus</li>
          <li><strong>Semantic HTML:</strong> Proper heading hierarchy and landmark regions for screen readers</li>
          <li><strong>Keyboard navigation:</strong> All interactive elements are accessible via keyboard</li>
          <li><strong>Focus indicators:</strong> Visible focus outlines when navigating with keyboard</li>
          <li><strong>ARIA labels:</strong> Descriptive labels for screen readers on interactive elements</li>
        </ul>

        <h3>Visual Design</h3>
        <ul>
          <li><strong>Color contrast:</strong> Text and interactive elements meet WCAG AA contrast ratios</li>
          <li><strong>Resizable text:</strong> Content remains readable when text is enlarged up to 200%</li>
          <li><strong>No color-only indicators:</strong> Information is not conveyed by color alone</li>
          <li><strong>Responsive design:</strong> Content adapts to different screen sizes and orientations</li>
        </ul>

        <h3>Content & Media</h3>
        <ul>
          <li><strong>Alt text:</strong> Meaningful alternative text for images and icons</li>
          <li><strong>Link purpose:</strong> Links clearly describe their destination</li>
          <li><strong>Form labels:</strong> All form inputs have associated labels</li>
          <li><strong>Error identification:</strong> Form errors are clearly identified and described</li>
        </ul>

        <h3>Assistive Technology</h3>
        <ul>
          <li><strong>Screen reader compatible:</strong> Tested with NVDA, VoiceOver, and JAWS</li>
          <li><strong>Live regions:</strong> Dynamic content updates are announced to screen readers</li>
          <li><strong>Accessibility widget:</strong> On-page tools to adjust display settings</li>
        </ul>

        <h2>Accessibility Widget</h2>
        <p>
          We provide an accessibility widget on all pages that allows you to customize
          your experience. Look for the accessibility icon (wheelchair symbol) in the
          corner of your screen. Features include:
        </p>
        <ul>
          <li>Increase or decrease text size</li>
          <li>High contrast mode</li>
          <li>Highlight links</li>
          <li>Readable fonts (dyslexia-friendly option)</li>
          <li>Pause animations</li>
          <li>Large cursor</li>
        </ul>

        <h2>Known Limitations</h2>
        <p>
          Despite our efforts, some content may have accessibility limitations. We are
          actively working on the following areas:
        </p>
        <ul>
          <li>Some older PDF documents may not be fully accessible</li>
          <li>Third-party embedded content may not meet all accessibility standards</li>
          <li>Some complex data visualizations in the analytics dashboard</li>
          <li>QR code scanning requires camera access which may have device-specific limitations</li>
        </ul>

        <h2>Feedback & Assistance</h2>
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '8px',
          padding: '1rem 1.5rem',
          margin: '1rem 0'
        }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong>We want to hear from you!</strong>
          </p>
          <p style={{ margin: 0 }}>
            If you encounter any accessibility barriers or have suggestions for improvement,
            please contact us. We take all feedback seriously and will work to address
            issues promptly.
          </p>
        </div>

        <p>You can reach our accessibility team through the following methods:</p>
        <ul>
          <li>
            <strong>Email:</strong>{" "}
            <a href="mailto:accessibility@getonblockchain.com">accessibility@getonblockchain.com</a>
          </li>
          <li>
            <strong>General Support:</strong>{" "}
            <a href="mailto:support@getonblockchain.com">support@getonblockchain.com</a>
          </li>
          <li>
            <strong>Phone:</strong> Available upon request for accessibility assistance
          </li>
        </ul>

        <p>When contacting us about an accessibility issue, please include:</p>
        <ul>
          <li>The web page URL where you encountered the issue</li>
          <li>A description of the problem</li>
          <li>The assistive technology you were using (if applicable)</li>
          <li>Your browser and operating system</li>
        </ul>

        <h2>Compatibility</h2>
        <p>
          Get On Blockchain is designed to be compatible with the following assistive
          technologies:
        </p>
        <ul>
          <li>Screen readers (NVDA, JAWS, VoiceOver, TalkBack)</li>
          <li>Screen magnification software</li>
          <li>Speech recognition software</li>
          <li>Keyboard-only navigation</li>
        </ul>

        <p>
          <strong>Browser compatibility:</strong> Our platform works best with the latest
          versions of Chrome, Firefox, Safari, and Edge. Internet Explorer is not supported.
        </p>

        <h2>Technical Specifications</h2>
        <p>
          Accessibility of Get On Blockchain relies on the following technologies to work
          with the particular combination of web browser and any assistive technologies
          or plugins installed on your computer:
        </p>
        <ul>
          <li>HTML5</li>
          <li>WAI-ARIA</li>
          <li>CSS</li>
          <li>JavaScript</li>
        </ul>
        <p>
          These technologies are relied upon for conformance with the accessibility
          standards used.
        </p>

        <h2>Assessment Approach</h2>
        <p>
          Get On Blockchain assessed the accessibility of this website through the
          following approaches:
        </p>
        <ul>
          <li>Self-evaluation using automated accessibility testing tools</li>
          <li>Manual testing with keyboard navigation</li>
          <li>Screen reader testing</li>
          <li>User feedback and reported issues</li>
        </ul>

        <h2>Formal Complaints</h2>
        <p>
          If you are not satisfied with our response to an accessibility concern, you
          may escalate the issue by:
        </p>
        <ol>
          <li>Emailing our compliance team at{" "}
            <a href="mailto:compliance@getonblockchain.com">compliance@getonblockchain.com</a>
          </li>
          <li>Filing a formal written complaint via mail to our address below</li>
        </ol>
        <p>
          We aim to respond to accessibility complaints within 5 business days and
          provide a resolution or action plan within 30 days.
        </p>

        <h2>Contact Information</h2>
        <p>
          Get On Blockchain LLC<br />
          7901 N 4th Street Ste 300<br />
          St Petersburg, FL 33702, USA<br />
          <br />
          Email: <a href="mailto:accessibility@getonblockchain.com">accessibility@getonblockchain.com</a>
        </p>

        <div style={{
          background: '#faf5ff',
          border: '1px solid #d8b4fe',
          borderRadius: '8px',
          padding: '1rem 1.5rem',
          margin: '2rem 0 1rem 0'
        }}>
          <p style={{ margin: 0, fontStyle: 'italic' }}>
            This statement was created on February 4, 2026, and will be reviewed and
            updated regularly to reflect ongoing improvements and changes to our platform.
          </p>
        </div>
      </div>
    </main>
  );
}
