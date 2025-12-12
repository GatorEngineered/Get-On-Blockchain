# 🔧 FIX TYPESCRIPT ERRORS - Run This Script
# This will regenerate Prisma Client and fix all TypeScript errors

Write-Host "🚀 Fixing TypeScript errors..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Pull latest changes
Write-Host "📥 Step 1: Pulling latest changes from git..." -ForegroundColor Yellow
git pull
Write-Host "✅ Git pull complete!" -ForegroundColor Green
Write-Host ""

# Step 2: Install dependencies (in case anything is missing)
Write-Host "📦 Step 2: Installing dependencies..." -ForegroundColor Yellow
npm install
Write-Host "✅ Dependencies installed!" -ForegroundColor Green
Write-Host ""

# Step 3: Generate Prisma Client
Write-Host "🔨 Step 3: Regenerating Prisma Client with new schema..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client regenerated successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Prisma generate failed. See error above." -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Try running: npm install" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 4: Run migration
Write-Host "🗄️ Step 4: Running database migration..." -ForegroundColor Yellow
npx prisma migrate dev --name add_custodial_wallets
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database migration complete!" -ForegroundColor Green
} else {
    Write-Host "❌ Migration failed. See error above." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Verify with Prisma Studio (optional)
Write-Host "🎉 All done! TypeScript errors should be fixed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart TypeScript server in VS Code:" -ForegroundColor White
Write-Host "     - Press: Ctrl + Shift + P" -ForegroundColor Gray
Write-Host "     - Type: 'TypeScript: Restart TS Server'" -ForegroundColor Gray
Write-Host "     - Press Enter" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Verify database schema (optional):" -ForegroundColor White
Write-Host "     npx prisma studio" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Check that TypeScript errors are gone in VS Code!" -ForegroundColor White
Write-Host ""
Write-Host "✨ Ready to continue building!" -ForegroundColor Green
