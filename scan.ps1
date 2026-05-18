# scan.ps1 — актуальные номера строк ключевых функций в index.html
# Запуск: .\scan.ps1
# Использовать после крупных правок чтобы обновить карту в CLAUDE.md

$fns = @(
  "processMatches","triggerSpecial","triggerCombinedSpecial","applyGravity","fillFromTop",
  "animateDrop","animateSwap","animateDestroy","animateFishFlight","findFishTarget",
  "trySwap","canSwap","findBestHint","checkWin","calcStars","showWin","showLose",
  "showScreen","saveGame","loadGame","buildSaveObj","applySaveObj",
  "drawBoard","drawShape","drawCellGem","findMatches","spawnParticles","initBoard",
  "generateLevel","generateArena","seededRandom","generateDailyQuests","renderQuestsFull",
  "showToast","updateHUD","simulateLevel","runBalanceReport","activateSpecials",
  "shopBuy","initDevPanel","claimDailyReward","unlockAchievement"
)

Write-Host "`nФункция                             Строка"
Write-Host "---------------------------------------"

foreach ($fn in $fns) {
    $hit = Select-String -Path "index.html" `
        -Pattern "(^|\s)(async\s+)?function\s+$fn\b|(^|[\s,{])$fn\s*[=:]\s*(async\s+)?(function|\()" |
        Select-Object -First 1
    if ($hit) {
        "{0,-35} {1}" -f $fn, $hit.LineNumber
    } else {
        "{0,-35} NOT FOUND" -f $fn
    }
}
