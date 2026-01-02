#!/bin/bash

# List of files to fix
files=(
  "src/app/api/merchant/update-loyalty-program/route.ts"
  "src/app/api/merchant/toggle-payouts/route.ts"
  "src/app/api/merchant/update-payout-settings/route.ts"
  "src/app/api/merchant/connect-payout-wallet/route.ts"
  "src/app/api/merchant/change-password/route.ts"
)

for file in "${files[@]}"; do
  echo "Processing $file..."
  
  # Create a temporary file with the parsing logic
  node -e "
    const fs = require('fs');
    const content = fs.readFileSync('$file', 'utf8');
    
    // Replace the pattern
    const newContent = content.replace(
      /where: { id: session\.value }/g,
      'where: { id: merchantId }'
    );
    
    // Add session parsing after the session check
    const pattern = /(if \(!session\?\.value\) \{\s+return NextResponse\.json\(\s+\{ error: \"Not authenticated\" \},\s+\{ status: 401 \}\s+\);\s+\})/;
    
    const replacement = \`\$1

    // Parse session data from JSON
    let sessionData;
    try {
      sessionData = JSON.parse(session.value);
    } catch (e) {
      return NextResponse.json(
        { error: \"Invalid session\" },
        { status: 401 }
      );
    }

    const merchantId = sessionData.merchantId;
    if (!merchantId) {
      return NextResponse.json(
        { error: \"Invalid session\" },
        { status: 401 }
      );
    }\`;
    
    const finalContent = newContent.replace(pattern, replacement);
    
    fs.writeFileSync('$file', finalContent, 'utf8');
    console.log('Fixed: $file');
  "
done

echo "All files fixed!"
