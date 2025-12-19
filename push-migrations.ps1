# PowerShell script to push Supabase migrations
# Run this script: .\push-migrations.ps1

Write-Host "🚀 Pushing Supabase Migrations..." -ForegroundColor Cyan
Write-Host ""

# Check if logged in
Write-Host "Checking Supabase login status..." -ForegroundColor Yellow
$loginCheck = npx supabase projects list 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in. Please login first:" -ForegroundColor Red
    Write-Host "   npx supabase login" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This will open a browser window for authentication." -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Logged in!" -ForegroundColor Green
Write-Host ""

# Link project
Write-Host "Linking to project: pdtwvfztracwpntpxjex" -ForegroundColor Yellow
npx supabase link --project-ref pdtwvfztracwpntpxjex

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link project. Please check your project ID and database password." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project linked!" -ForegroundColor Green
Write-Host ""

# Push migrations
Write-Host "Pushing migrations..." -ForegroundColor Yellow
npx supabase db push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migrations pushed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Verify tables in Supabase Dashboard → Table Editor" -ForegroundColor Gray
    Write-Host "2. Test registration flow" -ForegroundColor Gray
    Write-Host "3. Check admin dashboard for customers" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Failed to push migrations. Check errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Use Supabase Dashboard SQL Editor" -ForegroundColor Yellow
    Write-Host "1. Go to: https://supabase.com/dashboard/project/pdtwvfztracwpntpxjex/sql" -ForegroundColor Gray
    Write-Host "2. Copy contents of: supabase/migrations/00_complete_setup.sql" -ForegroundColor Gray
    Write-Host "3. Paste and run in SQL Editor" -ForegroundColor Gray
}
