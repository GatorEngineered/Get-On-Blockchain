import Link from 'next/link';

export const metadata = {
  title: 'Member Management - Get On Blockchain Documentation',
  description: 'Learn how to manage members, award points, and build engagement in your loyalty program.',
};

export default function MembersPage() {
  return (
    <article>
      <h1>Member Management Guide</h1>
      <p>
        Your members are the heart of your loyalty program. This guide covers everything you
        need to know about managing members, awarding points, and driving engagement.
      </p>

      <h2>How Members Join</h2>
      <p>
        Members can join your loyalty program in several ways:
      </p>
      <ul>
        <li><strong>QR Code Scan:</strong> Customers scan your in-store QR code to join instantly</li>
        <li><strong>Website Signup:</strong> Direct them to your member portal at <code>/[your-slug]/join</code></li>
        <li><strong>Manual Addition:</strong> Add members manually from your dashboard</li>
      </ul>

      <h2 id="points">Understanding the Points System</h2>
      <p>
        Points are the currency of your loyalty program. Members earn points through visits
        and can redeem them for rewards.
      </p>

      <h3>How Members Earn Points</h3>
      <ul>
        <li><strong>Welcome Points:</strong> New members receive bonus points when they join (default: 10 points)</li>
        <li><strong>Visit Points:</strong> Members earn points each time they scan your QR code (default: 10 points per visit)</li>
        <li><strong>POS Integration:</strong> If connected, points can be awarded based on purchase amount</li>
        <li><strong>Manual Award:</strong> You can manually award bonus points for special occasions</li>
      </ul>

      <div className="tip">
        <strong>Important:</strong> Members can only earn visit points once per day at each location
        to prevent abuse.
      </div>

      <h3>Points Configuration</h3>
      <p>
        Customize your points settings in <Link href="/dashboard/settings?tab=reward-tiers">Settings → Reward Tiers</Link>:
      </p>
      <ul>
        <li><strong>Welcome Points:</strong> One-time bonus for new members</li>
        <li><strong>Points Per Visit:</strong> How many points members earn per check-in</li>
        <li><strong>VIP Threshold:</strong> Points needed to reach VIP tier</li>
        <li><strong>Super Threshold:</strong> Points needed to reach Super tier</li>
      </ul>

      <h2 id="tiers">Member Tiers</h2>
      <p>
        Tiers reward your most loyal customers with special status. The default tiers are:
      </p>

      <ul>
        <li><strong>Base:</strong> All new members start here</li>
        <li><strong>VIP:</strong> Members who reach the VIP threshold (default: 100 points)</li>
        <li><strong>Super:</strong> Your most loyal members (default: 200 points)</li>
      </ul>

      <p>
        On Growth and Pro plans, you can create unlimited custom tiers with your own names
        and thresholds.
      </p>

      <h2>Managing Members from the Dashboard</h2>

      <h3>Viewing Your Members</h3>
      <p>
        Access your member list from the <Link href="/dashboard/members">Members</Link> page
        in your dashboard. You can:
      </p>
      <ul>
        <li>Search members by name, email, or phone</li>
        <li>Filter by tier or activity status</li>
        <li>Sort by points, join date, or last visit</li>
        <li>Export member data to CSV</li>
      </ul>

      <h3>Member Details</h3>
      <p>
        Click on any member to view their full profile including:
      </p>
      <ul>
        <li>Current points balance</li>
        <li>Tier status</li>
        <li>Visit history</li>
        <li>Transaction history</li>
        <li>Rewards redeemed</li>
      </ul>

      <h3>Manual Point Adjustments</h3>
      <p>
        Need to add or remove points manually? From a member's profile, you can:
      </p>
      <ol>
        <li>Click "Adjust Points"</li>
        <li>Enter the amount (positive to add, negative to subtract)</li>
        <li>Add a reason for the adjustment</li>
        <li>Click "Apply"</li>
      </ol>

      <div className="warning">
        <strong>Note:</strong> All point adjustments are logged for audit purposes.
      </div>

      <h2>Engaging Your Members</h2>

      <h3>Email Marketing</h3>
      <p>
        Send targeted emails to your members (available on Basic plan and above):
      </p>
      <ul>
        <li>Welcome emails for new members</li>
        <li>Points balance reminders</li>
        <li>Special promotions and offers</li>
        <li>Reward milestone celebrations</li>
      </ul>

      <p>
        Configure email campaigns in <Link href="/dashboard/settings?tab=email-marketing">Settings → Email Marketing</Link>.
      </p>

      <h3>Best Practices</h3>
      <ul>
        <li><strong>Make joining easy:</strong> Display your QR code prominently at checkout</li>
        <li><strong>Celebrate milestones:</strong> Recognize members when they reach new tiers</li>
        <li><strong>Offer attainable rewards:</strong> Start with rewards that can be earned in 3-5 visits</li>
        <li><strong>Keep it simple:</strong> Don't overcomplicate your rewards structure</li>
        <li><strong>Respond quickly:</strong> Address member questions and issues promptly</li>
      </ul>

      <h2>Staff Management</h2>
      <p>
        Add staff members to help manage your loyalty program. Staff can:
      </p>
      <ul>
        <li>View member information</li>
        <li>Award and adjust points</li>
        <li>View reports (with permission)</li>
        <li>Manage settings (with permission)</li>
      </ul>

      <p>
        Invite staff from <Link href="/dashboard/staff">Dashboard → Staff</Link>. They'll receive
        an email invitation to set up their account.
      </p>

      <h2>Next Steps</h2>
      <ul>
        <li><Link href="/docs/payouts">Set up USDC payouts</Link> - Offer crypto rewards to members</li>
        <li><Link href="/docs/faq">FAQ</Link> - Common questions about members and points</li>
      </ul>
    </article>
  );
}
