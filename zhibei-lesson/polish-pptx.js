// 智备教案 - PPT 动画打磨模块（PowerPoint COM 自动化）
// 在 pptwise 渲染出的原生 PPTX 基础上，通过本机 PowerPoint 添加：
//   1) 全片转场（Fade/Push/Wipe/Split/RandomBars/Shape 循环 + 时长）
//   2) 逐元素入场动画（首个元素单击触发，其余自动接续，节奏感强）
//   3) 演讲者备注（教学过程 teacher/intent 写入对应页）
// 无 PowerPoint / 出错时静默跳过，不影响主流程。
const fs = require('fs');
const { execFileSync } = require('child_process');

// 转场效果池（PowerPoint 16.0 实测有效）
const TRANSITIONS = [3844, 3845, 3846, 3848, 3856, 3861];
// 入场动画池（msoAnimEffect 实测有效）：Fade/Wipe/FlyIn/Peek/Wheel/Split
const ENTRANCES = [10, 18, 2, 12, 22, 16];

// 数组 -> PowerShell @(...) 字面量（字符串单引号转义）
function psArray(arr) {
  if (!arr || !arr.length) return '@()';
  return '@(' + arr.map(function (x) {
    if (typeof x === 'number') return String(x);
    return "'" + String(x).replace(/'/g, "''") + "'";
  }).join(',') + ')';
}

// 生成 UTF-8 中文脚本（内部会 base64 包装，避免 PowerShell 编码问题）
function psScript(pptxPath, notes, trans, ents, maxS, tDur) {
  const esc = (s) => s.replace(/'/g, "''");
  return [
    "$ErrorActionPreference = 'Stop'",
    "$ppt = '" + esc(pptxPath) + "'",
    "if (-not (Test-Path $ppt)) { Write-Output 'POLISH_SKIP nofile'; exit 0 }",
    "$app = $null",
    "try { $app = New-Object -ComObject PowerPoint.Application } catch { Write-Output 'POLISH_SKIP nopp'; exit 0 }",
    "try {",
    "  $pres = $app.Presentations.Open($ppt, $false, $false, $true)",
    "  $cnt = $pres.Slides.Count",
    "  $notes = " + psArray(notes),
    "  $trans = " + psArray(trans),
    "  $ents = " + psArray(ents),
    "  for ($i = 1; $i -le $cnt; $i++) {",
    "    $s = $pres.Slides.Item($i)",
    "    try {",
    "      $s.SlideShowTransition.EntryEffect = $trans[($i - 1) % $trans.Count]",
    "      $s.SlideShowTransition.Duration = " + Number(tDur),
    "    } catch { }",
    "    $n = $s.Shapes.Count",
    "    $added = 0",
    "    for ($j = 1; $j -le $n; $j++) {",
    "      if ($added -ge " + parseInt(maxS, 10) + ") { break }",
    "      $sh = $s.Shapes.Item($j)",
    "      try {",
    "        $trigger = 3",
    "        if ($added -eq 0) { $trigger = 2 }",
    "        $m = $ents[($i + $j) % $ents.Count]",
    "        $null = $s.TimeLine.MainSequence.AddEffect($sh, $m, 0, $trigger)",
    "        $added++",
    "      } catch { }",
    "    }",
    "    if ($notes.Count -gt 0 -and $i -le $notes.Count) {",
    "      $nt = $notes[$i - 1]",
    "      if ($nt) {",
    "        try { $s.NotesPage.Shapes.Placeholders(2).TextFrame.TextRange.Text = $nt } catch { }",
    "      }",
    "    }",
    "  }",
    "  $pres.Save()",
    "  $pres.Close()",
    "  Write-Output ('POLISH_OK slides=' + $cnt)",
    "} finally {",
    "  if ($app) { $app.Quit() }",
    "}"
  ].join("\n");
}

/**
 * 打磨一份 PPTX：转场 + 入场动画 + 演讲者备注（原地修改）
 * @param {string} pptxPath .pptx 绝对路径
 * @param {string[]} notes 每页演讲者备注（可空）
 * @param {object} opts { maxShapesPerSlide=6, transitionDuration=0.6 }
 * @returns {boolean} 是否执行成功（false = 无 PowerPoint / 跳过 / 失败）
 */
function polishPptx(pptxPath, notes, opts) {
  opts = opts || {};
  if (!fs.existsSync(pptxPath)) return false;
  // 在临时副本上打磨，规避原文件被预览/缩略图句柄占用导致 Save 失败
  const os = require('os');
  const pathMod = require('path');
  const tmpPptx = pathMod.join(os.tmpdir(), 'polishdeck_' + Date.now() + '.pptx');
  fs.copyFileSync(pptxPath, tmpPptx);
  const inner = psScript(
    tmpPptx, notes || [], TRANSITIONS, ENTRANCES,
    opts.maxShapesPerSlide || 6,
    opts.transitionDuration != null ? opts.transitionDuration : 0.6
  );
  // base64 包装规避 PowerShell 对无 BOM UTF-8 的 ANSI 误读（中文备注安全）
  const b64 = Buffer.from(inner, 'utf8').toString('base64');
  const wrapper = [
    "$ErrorActionPreference = 'Stop'",
    "$b64 = '" + b64 + "'",
    "$script = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64))",
    "Invoke-Expression $script"
  ].join("\n");
  const tmpPs = require('path').join(require('os').tmpdir(), 'polish_' + Date.now() + '.ps1');
  fs.writeFileSync(tmpPs, wrapper, 'utf8'); // wrapper 是纯 ASCII
  try {
    execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', tmpPs], {
      stdio: 'ignore', timeout: 240000
    });
    // 打磨成功：副本拷回原路径（原子替换风格）
    fs.copyFileSync(tmpPptx, pptxPath);
    return true;
  } catch (e) {
    return false;
  } finally {
    try { fs.unlinkSync(tmpPs); } catch (e) {}
    try { fs.unlinkSync(tmpPptx); } catch (e) {}
  }
}

module.exports = { polishPptx, TRANSITIONS, ENTRANCES };
