# PowerShell script to help convert CSS files to CSS modules
# This script renames files and provides a template for manual conversion

$cssFiles = Get-ChildItem -Path "src" -Recurse -Filter "*.css" | 
    Where-Object { 
        $_.Name -notlike "*.module.css" -and 
        $_.Name -ne "index.css" -and 
        $_.Name -ne "App.css" 
    }

Write-Host "Found $($cssFiles.Count) CSS files to convert" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $cssFiles) {
    $moduleName = $file.Name -replace "\.css$", ".module.css"
    $modulePath = Join-Path $file.DirectoryName $moduleName
    
    Write-Host "Processing: $($file.FullName)" -ForegroundColor Cyan
    
    # Read the CSS file
    $content = Get-Content $file.FullName -Raw
    
    # Basic conversion: convert kebab-case class names to camelCase
    # This is a basic conversion - manual review needed
    $content = $content -replace '\.([a-z]+)-([a-z-]+)', {
        param($match)
        $parts = $match.Groups[2].Value -split '-'
        $camelCase = $match.Groups[1].Value + ($parts | ForEach-Object { 
            $_.Substring(0,1).ToUpper() + $_.Substring(1) 
        }) -join ''
        ".$camelCase"
    }
    
    # Write module file (commented out for safety - uncomment to actually create files)
    # $content | Set-Content $modulePath -Encoding UTF8
    Write-Host "  Would create: $modulePath" -ForegroundColor Gray
    Write-Host "  NOTE: Manual review and JSX update required!" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Conversion template complete. Review and update JSX files manually." -ForegroundColor Green
Write-Host "Remember to:" -ForegroundColor Yellow
Write-Host "  1. Update imports: import styles from './Component.module.css'" -ForegroundColor White
Write-Host "  2. Update className: className={styles.className}" -ForegroundColor White
Write-Host "  3. Handle dynamic classes: className={`${styles.base} ${styles[variant]}`}" -ForegroundColor White

