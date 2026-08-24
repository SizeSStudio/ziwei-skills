# -*- coding: utf-8 -*-
"""
紫微斗数排盘引擎 —— 轻量 Python 重写版
逆向自「紫微星语」APP 的 native 排盘引擎 (libziweixingyu.so)

与传统紫微斗数的主要差异：
  1. 命宫起点：子宫起正月（非寅宫）
  2. 五行局：命宫干支纳音（非生年干+命宫支）
  3. 十二宫排列：命宫起逆行（非传统顺行）
  4. 四化体系：紫微斗数全书派（甲廉破武阳...）

用法：
    chart = ziwei_pan(year=2026, month=7, day=9, hour=12, gender=1)
"""

from __future__ import annotations
from datetime import datetime

# ============================================================
# 基础常量
# ============================================================

# 十二地支：子=0, 丑=1, 寅=2, 卯=3, 辰=4, 巳=5, 午=6, 未=7, 申=8, 酉=9, 戌=10, 亥=11
DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

# 十天干：甲=0, 乙=1, 丙=2, 丁=3, 戊=4, 己=5, 庚=6, 辛=7, 壬=8, 癸=9
TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

# 十二宫名（按命宫起逆行：命、兄、夫、子、财、疾、迁、友、官、田、福、父）
# 注意：此引擎为逆行排列，与传统顺行不同
GONG_MING = [
    '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
    '迁移', '交友', '官禄', '田宅', '福德', '父母'
]


# ============================================================
# 六十甲子纳音表
# 索引：ganzhi_index(干, 支) → 0-59
# 值：局数 (水二局=2, 木三局=3, 金四局=4, 土五局=5, 火六局=6)
# ============================================================

# 六十甲子顺序：甲子(0), 乙丑(1), 丙寅(2), ..., 癸亥(59)
# 纳音对应：
#   甲子乙丑 海中金 → 金四局(4)
#   丙寅丁卯 炉中火 → 火六局(6)
#   戊辰己巳 大林木 → 木三局(3)
#   庚午辛未 路旁土 → 土五局(5)
#   壬申癸酉 剑锋金 → 金四局(4)
#   甲戌乙亥 山头火 → 火六局(6)
#   丙子丁丑 涧下水 → 水二局(2)
#   戊寅己卯 城头土 → 土五局(5)
#   庚辰辛巳 白蜡金 → 金四局(4)
#   壬午癸未 杨柳木 → 木三局(3)
#   甲申乙酉 泉中水 → 水二局(2)
#   丙戌丁亥 屋上土 → 土五局(5)
#   戊子己丑 霹雳火 → 火六局(6)
#   庚寅辛卯 松柏木 → 木三局(3)
#   壬辰癸巳 长流水 → 水二局(2)
#   甲午乙未 沙中金 → 金四局(4)
#   丙申丁酉 山下火 → 火六局(6)
#   戊戌己亥 平地木 → 木三局(3)
#   庚子辛丑 壁上土 → 土五局(5)
#   壬寅癸卯 金箔金 → 金四局(4)
#   甲辰乙巳 覆灯火 → 火六局(6)
#   丙午丁未 天河水 → 水二局(2)
#   戊申己酉 大驿土 → 土五局(5)
#   庚戌辛亥 钗钏金 → 金四局(4)
#   壬子癸丑 桑柘木 → 木三局(3)
#   甲寅乙卯 大溪水 → 水二局(2)
#   丙辰丁巳 沙中土 → 土五局(5)
#   戊午己未 天上火 → 火六局(6)
#   庚申辛酉 石榴木 → 木三局(3)
#   壬戌癸亥 大海水 → 水二局(2)

NAYIN_JU = [
    4, 4, 6, 6, 3, 3, 5, 5, 4, 4, 6, 6,  # 甲子...乙亥
    2, 2, 5, 5, 4, 4, 3, 3, 2, 2, 5, 5,  # 丙子...丁亥
    6, 6, 3, 3, 2, 2, 4, 4, 6, 6, 3, 3,  # 戊子...己亥
    5, 5, 4, 4, 6, 6, 2, 2, 5, 5, 4, 4,  # 庚子...辛亥
    3, 3, 2, 2, 5, 5, 6, 6, 3, 3, 2, 2,  # 壬子...癸亥
]

WU_XING = {2: '水', 3: '木', 4: '金', 5: '土', 6: '火'}
JU_SHU_HANZI = {2: '二', 3: '三', 4: '四', 5: '五', 6: '六'}


def ganzhi_index(gan: int, zhi: int) -> int:
    """计算干支在六十甲子中的序号（0-59）"""
    # 找满足 n ≡ gan (mod 10) 且 n ≡ zhi (mod 12) 的最小非负整数 n
    for n in range(60):
        if n % 10 == gan and n % 12 == zhi:
            return n
    return 0


# ============================================================
# 天干四化表（紫微斗数全书派）
# 顺序：禄、权、科、忌
# ============================================================

SI_HUA = {
    0: ('廉贞', '破军', '武曲', '太阳'),   # 甲
    1: ('天机', '天梁', '紫微', '太阴'),   # 乙
    2: ('天同', '天机', '文昌', '廉贞'),   # 丙
    3: ('太阴', '天同', '天机', '巨门'),   # 丁
    4: ('贪狼', '太阴', '右弼', '天机'),   # 戊
    5: ('武曲', '贪狼', '天梁', '文曲'),   # 己
    6: ('太阳', '武曲', '太阴', '天同'),   # 庚
    7: ('巨门', '太阳', '文曲', '文昌'),   # 辛
    8: ('天梁', '紫微', '左辅', '武曲'),   # 壬
    9: ('破军', '巨门', '太阴', '贪狼'),   # 癸
}

SI_HUA_MING = ['禄', '权', '科', '忌']


# ============================================================
# 五虎遁：寅月天干由年干决定
# ============================================================

def wu_hu_dun(nian_gan: int) -> int:
    """五虎遁，返回寅月（正月）的天干序号"""
    # 甲己之年丙作首, 乙庚之年戊为头
    # 丙辛之岁寻庚起, 丁壬壬寅顺水流
    # 戊癸何方发, 甲寅之上好追求
    m = {0: 2, 5: 2,   # 甲己 → 丙
         1: 4, 6: 4,   # 乙庚 → 戊
         2: 6, 7: 6,   # 丙辛 → 庚
         3: 8, 8: 8,   # 丁壬 → 壬
         4: 0, 9: 0}   # 戊癸 → 甲
    return m[nian_gan]


# ============================================================
# 五鼠遁：子时天干由日干决定
# ============================================================

def wu_shu_dun(ri_gan: int) -> int:
    """五鼠遁，返回子时的天干序号"""
    # 甲己还加甲, 乙庚丙作初
    # 丙辛从戊起, 丁壬庚子居
    # 戊癸何方发, 壬子是真途
    m = {0: 0, 5: 0,   # 甲己 → 甲
         1: 2, 6: 2,   # 乙庚 → 丙
         2: 4, 7: 4,   # 丙辛 → 戊
         3: 6, 8: 6,   # 丁壬 → 庚
         4: 8, 9: 8}   # 戊癸 → 壬
    return m[ri_gan]


# ============================================================
# 四柱八字（公历 → 干支）
# ============================================================

def nian_ganzhi(year: int) -> tuple[int, int]:
    """年干支（以立春为界，此处简化为公历年份）"""
    # 1984 年是甲子年
    gan = (year - 1984) % 10
    zhi = (year - 1984) % 12
    return gan, zhi


def ri_ganzhi(year: int, month: int, day: int) -> tuple[int, int]:
    """日干支"""
    # 基准：2024-01-01 = 甲子日 = 干0 支0
    base = datetime(2024, 1, 1)
    target = datetime(year, month, day)
    delta = (target - base).days
    gan = delta % 10
    zhi = delta % 12
    return gan, zhi


def shi_zhi(hour: int) -> int:
    """时支：子时=23-1点，丑时=1-3点..."""
    # 子(0)=23-1, 丑(1)=1-3, 寅(2)=3-5, ..., 亥(11)=21-23
    if hour == 23:
        return 0
    return (hour + 1) // 2 % 12


def shi_gan(ri_gan_val: int, shi_zhi_val: int) -> int:
    """时干（五鼠遁）"""
    zi_gan = wu_shu_dun(ri_gan_val)
    return (zi_gan + shi_zhi_val) % 10


def yue_ganzhi(year: int, month: int) -> tuple[int, int]:
    """
    月干支（节气月，简化版）。
    近似：公历月对应地支（1月≈丑、2月≈寅...）
    """
    # 正月建寅：农历一月 = 寅月(地支2)
    # 近似：公历 month → 地支 = month % 12
    # 1月→丑(1), 2月→寅(2), ..., 12月→子(0)
    zhi = month % 12
    nian_gan_val, _ = nian_ganzhi(year)
    yin_gan = wu_hu_dun(nian_gan_val)
    # 从寅月起顺行
    gan = (yin_gan + (zhi - 2 + 12) % 12) % 10
    return gan, zhi


# ============================================================
# 命宫 / 身宫
# ============================================================

def ming_gong(month: int, shi_zhi_val: int) -> int:
    """
    命宫地支序号。

    规则（本引擎）：子宫起正月，顺数生月至生月，再从该宫起子时，逆数生时。
    公式：命宫 = (0 + month - 1 - shi_zhi_val) mod 12
    """
    return (month - 1 - shi_zhi_val) % 12


def shen_gong(month: int, shi_zhi_val: int) -> int:
    """
    身宫地支序号。

    规则：同起点，顺数生时。
    公式：身宫 = (0 + month - 1 + shi_zhi_val) mod 12
    """
    return (month - 1 + shi_zhi_val) % 12


# ============================================================
# 五行局（命宫干支纳音）
# ============================================================

def wu_xing_ju(ming_gan: int, ming_zhi: int) -> tuple[str, int]:
    """
    五行局 = 命宫干支纳音
    返回：(五行名, 局数)
    """
    idx = ganzhi_index(ming_gan, ming_zhi)
    ju = NAYIN_JU[idx]
    return WU_XING[ju], ju


# ============================================================
# 宫干分布（十二宫天干）
# ============================================================

def gong_gan(nian_gan_val: int) -> list[int]:
    """
    返回十二宫的天干（按地支顺序：子、丑、寅...亥）。
    即 result[i] = 第 i 个地支宫的天干序号。

    规则：寅宫起五虎遁天干，顺行十二宫。
    """
    yin_gan = wu_hu_dun(nian_gan_val)
    # 地支顺行步数 = (i - 2 + 12) % 12，天干同步顺行
    return [(yin_gan + (i - 2 + 12) % 12) % 10 for i in range(12)]


# ============================================================
# 命主 / 身主
# ============================================================

def ming_zhu(ming_zhi: int) -> str:
    """命主：命宫地支对应的星曜"""
    # 子贪狼 丑巨门 寅禄存 卯文曲 辰廉贞 巳武曲 午武曲 未太阴 申天同 酉天梁 戌紫微 亥天机
    m = {0: '贪狼', 1: '巨门', 2: '禄存', 3: '文曲',
         4: '廉贞', 5: '武曲', 6: '武曲', 7: '太阴',
         8: '天同', 9: '天梁', 10: '紫微', 11: '天机'}
    return m.get(ming_zhi, '')


def shen_zhu(shen_zhi: int) -> str:
    """身主：身宫地支对应的星曜"""
    # 子铃星 丑火星 寅文昌 卯天机 辰火星 巳铃星 午天相 未天梁 申文昌 酉天机 戌天相 亥天梁
    m = {0: '铃星', 1: '火星', 2: '文昌', 3: '天机',
         4: '火星', 5: '铃星', 6: '天相', 7: '天梁',
         8: '文昌', 9: '天机', 10: '天相', 11: '天梁'}
    return m.get(shen_zhi, '')


# ============================================================
# 主星安星（紫微 + 天府 双星系）
# ============================================================

def ziwei_wei(ju_shu: int, nongli_ri: int) -> int:
    """
    紫微星所在地支序号。

    传统口诀：
      局数 × 日数 = 基数
      奇加一偶除二 = 步数
      寅宫起，逆行步数 = 紫微所在
    """
    base = ju_shu * nongli_ri
    if base % 2 == 1:
        bu_shu = (base + 1) // 2
    else:
        bu_shu = base // 2
    return (2 - bu_shu) % 12


def tianfu_wei(ziwei_zhi: int) -> int:
    """
    天府星所在地支序号（与紫微呈对角线/对称关系）。
    传统：紫微与天府以寅申线为对称轴。
    """
    # 紫微在子 → 天府在辰？需要验证
    # 简化对称公式：天府 = (10 - ziwei_zhi) % 12? 待验证
    # 先按已知数据来验证
    return (10 - ziwei_zhi) % 12  # 占位，需验证


def an_zhu_xing(ziwei_zhi: int) -> dict[str, int]:
    """
    根据紫微位置，安放所有主星。
    返回：{星名: 地支序号}

    紫微系（顺行）：紫微、天机、太阳、武曲、天同、廉贞
    天府系（逆行）：天府、太阴、贪狼、巨门、天相、天梁、七杀、破军

    注意：这是传统紫微斗数的安星法，
    本引擎的具体安星规则待完整验证。
    """
    stars = {}

    # 紫微系
    stars['紫微'] = ziwei_zhi
    stars['天机'] = (ziwei_zhi - 1) % 12
    # 太阳、武曲、天同、廉贞的位置随格局变化，此处暂略

    # 天府系
    tianfu = tianfu_wei(ziwei_zhi)
    stars['天府'] = tianfu
    # 太阴、贪狼、巨门、天相、天梁、七杀、破军 暂略

    return stars


# ============================================================
# 农历转换（简化占位）
# ============================================================

def gongli_to_nongli(year: int, month: int, day: int) -> dict:
    """公历转农历（简化版，仅用于占位，实际项目请用专业农历库）"""
    # 简化：直接用公历月日近似
    return {
        '年': year,
        '月': month,
        '日': day,
        '是否闰月': 0,
    }


# ============================================================
# 主排盘函数
# ============================================================

def ziwei_pan(
    year: int,
    month: int,
    day: int,
    hour: int,
    minute: int = 0,
    second: int = 0,
    longitude: float = 120.0,
    timezone: int = -8,
    gender: int = 1,
) -> dict:
    """
    紫微斗数排盘。

    参数:
        year, month, day: 公历出生年月日
        hour, minute, second: 出生时分秒
        longitude: 经度（用于真太阳时校正）
        timezone: 时区偏移（东八区为 -8，与引擎输入一致）
        gender: 1=男, 0=女

    返回:
        排盘结果字典，结构与 native 引擎输出一致
    """
    # ---- 时间 ----
    clock_time = f"{year}-{month:02d}-{day:02d} {hour:02d}:{minute:02d}:{second:02d}"
    # TODO: 真太阳时 = 钟表时间 + 经度时差 + 均时差
    # 经度时差：(120 - longitude) * 4 分钟
    jingdu_shicha = (120.0 - longitude) * 4  # 分钟
    true_solar_time = clock_time  # 暂不校正

    # ---- 四柱八字 ----
    nian_gan_val, nian_zhi_val = nian_ganzhi(year)
    yue_gan_val, yue_zhi_val = yue_ganzhi(year, month)
    ri_gan_val, ri_zhi_val = ri_ganzhi(year, month, day)
    shiz = shi_zhi(hour)
    shig = shi_gan(ri_gan_val, shiz)

    # ---- 命宫 / 身宫 ----
    ming_zhi = ming_gong(month, shiz)
    shen_zhi = shen_gong(month, shiz)

    # ---- 宫干 ----
    gong_gan_list = gong_gan(nian_gan_val)
    ming_gan_val = gong_gan_list[ming_zhi]

    # ---- 五行局 ----
    wuxing, ju_shu = wu_xing_ju(ming_gan_val, ming_zhi)
    wuxing_ju_ming = f"{wuxing}{JU_SHU_HANZI[ju_shu]}局"

    # ---- 命主 / 身主 ----
    mzhu = ming_zhu(ming_zhi)
    szhu = shen_zhu(shen_zhi)

    # ---- 性别 ----
    # 阳干年(甲丙戊庚壬)生男=阳男、生女=阳女
    # 阴干年(乙丁己辛癸)生男=阴男、生女=阴女
    if nian_gan_val % 2 == 0:  # 阳干
        xingbie = "阳男" if gender == 1 else "阳女"
    else:
        xingbie = "阴男" if gender == 1 else "阴女"

    # ---- 农历（简化）----
    nongli = gongli_to_nongli(year, month, day)

    # ---- 十二宫信息 ----
    # 宫位排列：命宫起逆行
    # 命宫在 ming_zhi，然后逆方向：兄、夫、子、财、疾、迁、友、官、田、福、父
    shier_gong = {}
    for i in range(12):
        zhi = (ming_zhi - i) % 12  # 逆行
        gong_ming = GONG_MING[i]
        gan = gong_gan_list[zhi]

        gong_info = {
            '宫': gong_ming,
            '宫干': TIAN_GAN[gan],
            '星列表': {},
            '星庙旺': {},
            '四化': {},
            '自化': '',
            '冲化': '',
        }
        shier_gong[DI_ZHI[zhi]] = gong_info

    # ---- 生年四化 ----
    lu, quan, ke, ji = SI_HUA[nian_gan_val]
    # 四化落点需要根据星曜位置计算（待完整实现主星安星后补充）

    # ---- 组装结果 ----
    result = {
        '其他信息': {
            '性别': xingbie,
            '五行局': wuxing_ju_ming,
            '命主': mzhu,
            '身主': szhu,
            '身宫': DI_ZHI[shen_zhi],
            '命宫': DI_ZHI[ming_zhi],
            '经度': f"{longitude:.6f}",
            '真太阳时': true_solar_time,
            '钟表时间': clock_time,
            '农历年': str(nongli['年']),
            '农历月': str(nongli['月']),
            '农历是否闰月': str(nongli['是否闰月']),
            '农历日': str(nongli['日']),
            '小时数': str(hour),
            '分钟数': str(minute),
            '秒数': str(second),
            '时支': DI_ZHI[shiz],
            '时干': TIAN_GAN[shig],
            '日干': TIAN_GAN[ri_gan_val],
            '日支': DI_ZHI[ri_zhi_val],
            '月干': TIAN_GAN[yue_gan_val],
            '月支': DI_ZHI[yue_zhi_val],
            '年干': TIAN_GAN[nian_gan_val],
            '年支': DI_ZHI[nian_zhi_val],
        },
        '十二宫信息': shier_gong,
    }

    return result


# ============================================================
# 自测
# ============================================================

if __name__ == '__main__':
    # 测试用例：2026-07-09 12:00，经度 120，男
    chart = ziwei_pan(2026, 7, 9, 12, 0, 0, 120.0, -8, 1)

    info = chart['其他信息']
    print("=== 其他信息 ===")
    for k, v in info.items():
        print(f"  {k}: {v}")

    print("\n=== 十二宫（地支: 宫位/宫干）===")
    for z in DI_ZHI:
        if z in chart['十二宫信息']:
            g = chart['十二宫信息'][z]
            print(f"  {z}: {g['宫']} ({g['宫干']})")

    print("\n=== 验证（与 native 引擎对比）===")
    checks = [
        ('命宫', '子', info['命宫']),
        ('身宫', '子', info['身宫']),
        ('五行局', '土五局', info['五行局']),
        ('命主', '贪狼', info['命主']),
        ('身主', '铃星', info['身主']),
        ('年干', '丙', info['年干']),
        ('年支', '午', info['年支']),
        ('日干', '甲', info['日干']),
        ('日支', '申', info['日支']),
        ('月干', '乙', info['月干']),
        ('月支', '未', info['月支']),
        ('时干', '庚', info['时干']),
        ('时支', '午', info['时支']),
        ('性别', '阳男', info['性别']),
    ]
    all_pass = True
    for name, expected, actual in checks:
        ok = expected == actual
        if not ok:
            all_pass = False
        print(f"  {'✓' if ok else '✗'} {name}: 预期={expected}, 实际={actual}")

    # 宫位验证
    print("\n=== 宫位验证 ===")
    gong_checks = [
        ('子', '命宫', '庚'),
        ('丑', '父母', '辛'),
        ('寅', '福德', '庚'),
        ('卯', '田宅', '辛'),
        ('午', '迁移', '甲'),
        ('亥', '兄弟', '己'),
    ]
    for zhi, gong, gan in gong_checks:
        if zhi in chart['十二宫信息']:
            g = chart['十二宫信息'][zhi]
            ok_gong = g['宫'] == gong
            ok_gan = g['宫干'] == gan
            ok = ok_gong and ok_gan
            if not ok:
                all_pass = False
            print(f"  {'✓' if ok else '✗'} {zhi}宫: 预期={gong}/{gan}, 实际={g['宫']}/{g['宫干']}")

    print(f"\n{'全部通过！' if all_pass else '存在错误。'}")
