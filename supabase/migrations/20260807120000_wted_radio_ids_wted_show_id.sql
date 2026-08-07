-- wted_radio_ids.wted_show_id — add the column and backfill from Radio.co
-- playlist membership.
--
-- Generated 776 assignments from a full crawl of all 715 Radio.co
-- Studio playlists (radio-co-playlist-audit edge function). Every track below
-- appears in EXACTLY ONE playlist, which is what makes the assignment safe:
--   * 736 rows -> wted_show_id (the playlist id = wted_episodes.radio_id)
--   * 40 rows -> show_id      (the concert uuid = shows.show_id)
--
-- Deliberately NOT touched:
--   * 159 tracks in ZERO playlists — Radio.co pulls these by tag at play time
--     (station IDs, bumpers). Null is correct; they fall back to the WL image.
--   * 96 tracks in 2+ playlists — ambiguous, left null by decision.
--
-- Run as one transaction. Every statement is idempotent: the UPDATEs only touch
-- rows where BOTH columns are still null, so re-running cannot clobber a value
-- that was corrected by hand afterwards.

begin;

-- ── 1. schema ───────────────────────────────────────────────────────────────
-- Nullable text to match wted_episodes.radio_id, which stores the Radio.co
-- playlist id as text. Additive only: no existing column changes type, and the
-- wted_radio_ids_catalog view names its columns explicitly rather than using
-- select *, so it keeps working untouched until we choose to expose this.
alter table public.wted_radio_ids
  add column if not exists wted_show_id text;

comment on column public.wted_radio_ids.wted_show_id is
  'Radio.co playlist id (= wted_episodes.radio_id) for tracks that belong to a
   COMPILATION episode rather than a single concert. Mutually exclusive with
   show_id: show_id ties a track to one concert, wted_show_id ties it to one
   playlist. Null on both means the track is station content (tag-pulled IDs and
   bumpers) or ambiguous, and resolves to the WL fallback image.';

-- Read path filters on this to resolve artwork for a compilation airing.
create index if not exists wted_radio_ids_wted_show_id_idx
  on public.wted_radio_ids (wted_show_id)
  where wted_show_id is not null;

-- ── 2. backfill: wted_show_id (compilations) ────────────────────────────────
update public.wted_radio_ids w
set    wted_show_id = v.wted_show_id
from  (values
    ('29938985', '898399'),  -- Recap w/ Michael @Mjbasty1
    ('29938986', '898399'),  -- Intro by Michael @Mjbasty1
    ('29938987', '898399'),  -- Set Break w/Michael @Mjbasty1
    ('36326477', '1102522'),  -- Set Break 3 w/LarryHood78
    ('36326478', '1102522'),  -- Intro w/LarryHood78
    ('36326479', '1102522'),  -- Outro w/LarryHood78
    ('36326480', '1102522'),  -- Set Break 2 w/LarryHood78
    ('36326481', '1102522'),  -- Set Break 1 w/LarryHood 78
    ('29915951', '1028692'),  -- ThisOldTee.Com
    ('37758477', '1141854'),  -- requesTED Gold July 26 #3
    ('37758478', '1141854'),  -- requesTED Gold July 26 #2
    ('37758479', '1141854'),  -- requesTED Gold July 26 Intro and #5
    ('37758480', '1141854'),  -- requesTED Gold July 26 #1
    ('37758481', '1141854'),  -- requesTED Gold July 26 #4
    ('37195169', '1126655'),  -- requsTED Gold #3 May 26
    ('37195170', '1126655'),  -- requesTED Gold #1 May 26
    ('37195171', '1126655'),  -- requesTED Gold #4 May 26
    ('37195172', '1126655'),  -- requesTED Gold #2 May 26
    ('37195173', '1126655'),  -- requesTED Gold Intro and #5 May 26
    ('37463234', '1135467'),  -- requesTED Gold June 26 #2
    ('37463235', '1135467'),  -- requesTED Gold June 26 #1
    ('37463236', '1135467'),  -- requesTED Gold June 26 #4
    ('37463237', '1135467'),  -- requesTED Gold June 26 #3
    ('37463238', '1135467'),  -- requesTED Gold June 26 Intro and #5
    ('37345646', '1130746'),  -- Ted Tracks Vol. 003 - Intro
    ('37345691', '1130751'),  -- Ted Tracks Vol. 004 - Intro
    ('37345753', '1130753'),  -- Ted Tracks Vol. 005 - Intro
    ('37351218', '1130754'),  -- Ted Tracks Vol. 006 - Intro
    ('37351267', '1130755'),  -- Ted Tracks Vol. 007 - Intro
    ('37351327', '1130758'),  -- Ted Tracks Vol. 008 - Intro
    ('37351772', '1131985'),  -- Big Debut! // Big Modern! - The Live Collect
    ('37323585', '1130744'),  -- Ted Tracks Vol. 001 - Intro
    ('37323586', '1130745'),  -- Ted Tracks Vol. 002 - Intro
    ('37029467', '1116563'),  -- Regress to the Mean: 2018 Fall, Intro
    ('37070714', '1116571'),  -- Regress to the Mean: 2019 Winter, Set Break
    ('37070715', '1116571'),  -- Regress to the Mean: 2019 Winter, Intro
    ('37071298', '1116568'),  -- Regress to the Mean: 2019 Spring, Intro
    ('37071369', '1116569'),  -- Regress to the Mean: 2019 Summer, Intro
    ('37071426', '1116567'),  -- Regress to the Mean: 2019 Fall, Encore Break
    ('37071427', '1116567'),  -- Regress to the Mean: 2019 Fall, Intro
    ('37071428', '1116567'),  -- Regress to the Mean: 2019 Fall, Set Break
    ('37028929', '1121929'),  -- Saturday Six-Pack, Volume 6 - Intro
    ('37029369', '1116564'),  -- Regress to the Mean: 2018 Spring, Intro
    ('37029419', '1116565'),  -- Regress to the Mean: 2018 Summer, Intro
    ('36995671', '1119466'),  -- Saturday Six-Pack, Volume 5 - Set Break
    ('36995672', '1119466'),  -- Saturday Six-Pack, Volume 5 - Intro
    ('36886861', '1116558'),  -- Saturday Six-Pack, Volume 2 - Intro
    ('36886973', '1116561'),  -- Saturday Six-Pack, Volume 3 - Intro
    ('36952055', '1119348'),  -- Saturday Six-Pack, Volume 4 - Intro
    ('36952209', '1116566'),  -- Regress to the Mean: 2018 Winter - Intro
    ('36886813', '1116555'),  -- Saturday Six-Pack, Volume 1 - Intro
    ('27255447', '814275'),  -- In Memoriam: Jerry Garcia
    ('28868160', '862561'),  -- Intro w/ @WhyWeiman
    ('28868162', '862561'),  -- Set Break w/ @WhyWeiman
    ('28911432', '864113'),  -- Break w/ @Norm
    ('28911433', '864113'),  -- Intro w/ @Norm
    ('37271198', '1129274'),  -- Set Break w/ ShawnaLee
    ('37271199', '1129274'),  -- Recap w/ Basty
    ('37271200', '1129274'),  -- Intro w/ Sim
    ('37271319', '1129274'),  -- Break w/ Kyle
    ('36235154', '1099834'),  -- Intro w/Ben
    ('36235166', '1099835'),  -- Intro w/Ben
    ('36235175', '1099836'),  -- Intro w/Ben
    ('36235184', '1099837'),  -- Intro w/Ben
    ('32583732', '979256'),  -- Set Break w/ Ben
    ('32583733', '979256'),  -- Outro w/ Ben
    ('32583731', '979256'),  -- Intro w/ Ben
    ('32591078', '979508'),  -- Outro w/ Ben
    ('32591080', '979508'),  -- Break 3 w/ Ben
    ('32591081', '979508'),  -- Break 2 w/ Ben
    ('32591082', '979508'),  -- Break 1 w/ Ben
    ('32591084', '979508'),  -- Intro w/ Ben
    ('36235192', '1099838'),  -- Intro w/Ben
    ('33336658', '1004410'),  -- Set Break 2 w/Ben
    ('33336659', '1004410'),  -- Outro w/Ben
    ('33336660', '1004410'),  -- Intro w/Ben
    ('33337021', '1004410'),  -- Set Break 1 w/Ben
    ('33337259', '1004410'),  -- Set Break 3 w/Ben
    ('33337540', '1004453'),  -- Set Break 2 w/Ben
    ('33337541', '1004453'),  -- Set Break 1 w/Ben
    ('33337542', '1004453'),  -- Outro w/Ben
    ('33337543', '1004453'),  -- Intro w/Ben
    ('32577612', '979041'),  -- Set Break 2 w/ Ben
    ('32577613', '979041'),  -- Set Break 3 w/Ben
    ('32577614', '979041'),  -- Set Break 1 w/ Ben
    ('32577628', '979041'),  -- Outro w/ Ben
    ('32577615', '979041'),  -- Intro w/ Ben
    ('32577507', '979037'),  -- Set Break 2 w/ Ben
    ('32577508', '979037'),  -- Set Break 1 w/ Ben
    ('32577509', '979037'),  -- Outro w/ Ben
    ('32577510', '979037'),  -- Intro w/ Ben
    ('31573223', '947360'),  -- Sept 24 Set 2 intro with Ben
    ('31573224', '947360'),  -- Sept 24 Break 8 with Ben
    ('31573211', '947360'),  -- Sept 24 Break 7 with Ben
    ('31573213', '947360'),  -- Sept 24 Break 6 with Ben
    ('31573215', '947278'),  -- Sept 24 Break 1 with Ben
    ('31573216', '947360'),  -- Sept 24 Break 5 with Ben
    ('31573217', '947278'),  -- Sept 24 Break 2 with Ben
    ('31573218', '947278'),  -- Sept 24 Break 4 with Ben
    ('31573220', '947278'),  -- Sept 24 Break 3 with Ben
    ('31573222', '947278'),  -- Sept 24 Intro with Ben
    ('36445271', '1106276'),  -- Intro w/Ben
    ('36191277', '1098266'),  -- Intro w/Ben
    ('36191289', '1098267'),  -- Intro w/Ben
    ('36191297', '1098269'),  -- Intro w/Ben
    ('36191267', '1098264'),  -- Intro w/Ben
    ('29830027', '891879'),  -- Wrap up w/ @BenChasingSatellites
    ('29830028', '891879'),  -- Set Break w/ @BenChasingSatellites
    ('29830109', '891885'),  -- Wrap up w/ @BenChasingSatellites
    ('29830110', '891885'),  -- Intro w/ @BenChasingSatellites
    ('29830108', '891885'),  -- Set Break w/ @BenChasingSatellites
    ('29830026', '891879'),  -- Intro w/ @BenChasingSatellites
    ('30905568', '925183'),  -- Break2 w/ Ben
    ('30905569', '925183'),  -- Break1 w/ Ben
    ('30905570', '925183'),  -- Intro w/ Ben
    ('30905566', '925183'),  -- Break4 w/ Ben
    ('30905567', '925183'),  -- Break3 w/ Ben
    ('30905652', '925188'),  -- Break4 w/ Ben
    ('30905653', '925188'),  -- Break2 w/ Ben
    ('30905654', '925188'),  -- Break3 w/ Ben
    ('30905655', '925188'),  -- Break1 w/ Ben
    ('30905656', '925188'),  -- Intro w/ Ben
    ('31573066', '947252'),  -- Ben Perfect Spring 23 Intro
    ('31573067', '947252'),  -- Ben Perfect Spring 23 set break
    ('31573068', '947252'),  -- Ben Perfect Spring 23 Wrap Up
    ('28784141', '860044'),  -- Set Break w/ BenChasingSatellites
    ('28784142', '860044'),  -- Intro w/ @BenChasingSatellites
    ('28813654', '860880'),  -- Intro w/ Ben @BenChasingSatellites
    ('28813655', '860880'),  -- Set Break w/ Ben @BenChasingSatellites
    ('27469992', '820942'),  -- Dear Prudence - 2021/07/13 Red Rocks Ampithe
    ('37696744', '1140064'),  -- Intro w/Ben & Mary
    ('37696745', '1140065'),  -- Intro w/Ben & Garloo
    ('37696716', '1140062'),  -- Intro w/Ben & Mary
    ('37696720', '1140062'),  -- Mr. Action w/Garloo
    ('29960429', '896358'),  -- Break w/Dean #3
    ('29960430', '896358'),  -- Break w/Dean #1
    ('29960431', '896358'),  -- Break w/Dean #6
    ('29960432', '896358'),  -- Break w/Dean #9
    ('29960433', '896358'),  -- Break w/Dean #8
    ('29960434', '896358'),  -- Break w/Dean #5
    ('29960435', '896358'),  -- Break w/Dean #4
    ('29960436', '896358'),  -- Break w/Dean #7
    ('29960437', '896358'),  -- Break  w/Dean #2
    ('29960438', '896358'),  -- Intro w/ Dean #10
    ('34561669', '1043886'),  -- Chain Yer Dragon with Basty
    ('35544136', '1077548'),  -- Starship 21 Ep 5 - MD Layover
    ('34572789', '1041763'),  -- Intro w/ Corry
    ('34572790', '1041763'),  -- Set Break 2 w/ Corry
    ('34572786', '1041763'),  -- Recap w/ Corry
    ('34572787', '1041763'),  -- Set Break 1 w/ Corry
    ('35518833', '1076633'),  -- Set Break w/ Corry
    ('35518834', '1076633'),  -- Intro w/ Corry
    ('35518835', '1076633'),  -- Recap w/ Corry
    ('36238094', '1099893'),  -- Intro w/Corry
    ('36238095', '1099893'),  -- Set Break w/Corry
    ('36238096', '1099893'),  -- Recap w/Corry
    ('37619800', '1138209'),  -- Recap w/ Corry
    ('37619801', '1138209'),  -- Intro w/ Corry
    ('37619802', '1138209'),  -- Set Break w/ Corry
    ('34353886', '1038419'),  -- Intro w/ Corry
    ('34353926', '1038419'),  -- Set Break 1 w/ Corry
    ('34353949', '1038419'),  -- Set Break 2 w/ Corry
    ('34354001', '1038419'),  -- Recap w/ Corry
    ('29033266', '866856'),  -- Set Break w/ @BenChasingSatellites
    ('29033267', '866856'),  -- Intro w/ @BenChasingSatellites
    ('29592498', '884156'),  -- Intro w/ @BenChasingSatellites
    ('29592500', '884156'),  -- Set Break w/ @BenChasingSatellites
    ('30490250', '912491'),  -- Set Break w/ @BenchasingSatellites
    ('30490252', '912491'),  -- Intro w/ @Benchasingsatellites
    ('35056919', '1062000'),  -- Set Break w/Ben, Annie, Beth, and Tug
    ('35056920', '1062000'),  -- Intro w/Ben, Beth, Dean, Annie, Brett, Bobo,
    ('35056921', '1062000'),  -- Set Break w/Ben, Dean, Annie, Bobo, Beth, an
    ('35056922', '1062000'),  -- Set Break w/Ben, Tug, and Brett
    ('35056923', '1062000'),  -- Set Break w/Ben, Annie, Beth, Dean, Bobo, an
    ('35136477', '1062000'),  -- Outro w/Ben, Beth, and Tug
    ('32300457', '970047'),  -- Break 3 w/ Ben, Brendan, Tug
    ('32300461', '970047'),  -- Break 2 w/ Ben, Brendan, Tug
    ('32300466', '970047'),  -- Intro w/ Ben, Brendan, Tug
    ('32311861', '970047'),  -- Break 1 w/ Ben, Brendan, Tug
    ('34171386', '1031974'),  -- Set Break 1 w/Ben
    ('34171387', '1031974'),  -- Outro w/Ben
    ('34171388', '1031974'),  -- Set Break 2 w/Ben
    ('34171389', '1031974'),  -- Intro w/Ben
    ('30485523', '910522'),  -- Dripfield Live Introduction w/ Dean
    ('30485529', '910522'),  -- Slow Ready w @BenChasingSatellites
    ('30485531', '910522'),  -- The Whales w/ @Dashbord
    ('30485497', '910522'),  -- Arrow w/ Lucas Anderton
    ('30485498', '910522'),  -- Borne w/ @GooseBandMemes
    ('30485500', '910522'),  -- Transition from Disc 1 to Disc 2 w/ Dean
    ('30485506', '910522'),  -- Hungersite w/ @WaltonsJoint
    ('30485507', '910522'),  -- Flipping from Side One to Side Two
    ('30485511', '910522'),  -- Dripfield w David Tracer
    ('30485515', '910522'),  -- Honeybee and 726 w/ Jon & Paige Caruso
    ('30485520', '910522'),  -- Hot Tea & Moonrise w/ Dean
    ('36788511', '1115191'),  -- EMG Intro w/Ben
    ('36127040', '1096152'),  -- Intro w/Ben
    ('36135269', '1096217'),  -- Intro to Part 3 w/Ben
    ('36135270', '1096173'),  -- Intro to Part 2 w/Ben
    ('30203776', '903117'),  -- Intro w/ @Norm
    ('30203777', '903117'),  -- Break w/ @Norm
    ('30203778', '903117'),  -- Break w/ @Norm
    ('30203779', '903117'),  -- Break w/ @Norm
    ('30203780', '903117'),  -- Break w/ @Norm
    ('30292178', '906054'),  -- Break w/ @Norm
    ('30292179', '906054'),  -- Break w/ @Norm
    ('30292180', '906054'),  -- Break w/ @Norm
    ('30292176', '906054'),  -- Break w/ @Norm
    ('30292177', '906054'),  -- Intro w/ @Norm
    ('34489676', '1041879'),  -- Break #4 w/ Norm
    ('34489677', '1041879'),  -- Break #3 w/ Norm
    ('34489678', '1041879'),  -- Break #5 w/ Norm
    ('34489679', '1041879'),  -- Break #2 /w Norm
    ('34489680', '1041879'),  -- Intro w/ Norm
    ('31460951', '942988'),  -- Break #3 w/ Norm
    ('31460952', '942988'),  -- Break #2 w/ Norm
    ('31460953', '942988'),  -- Break #4 w/ Norm
    ('31460954', '942988'),  -- Break #5 w/ Norm
    ('31460955', '942988'),  -- Intro w/ Norm
    ('29272736', '872292'),  -- Recap w/ @FactoryPhishin
    ('29272738', '872292'),  -- Intro w/ @FactoryPhishin
    ('29272739', '872292'),  -- Set Break w/ @FactoryPhishin
    ('37208819', '1126976'),  -- OnlyJams Mix by @TugMartin: Tug's Nugs, 2026
    ('37208820', '1126974'),  -- OnlyJams Mix by @TugMartin: Tug's Nugs, 2026
    ('36932844', '1119348'),  -- Saturday Six-Pack: Volume 4, Instrumentals -
    ('36736212', '1113888'),  -- OnlyJams Mix by @TugMartin: Tug'sNugs, 2023,
    ('36638701', '1036752'),  -- OnlyJams Mix by @Tug Martin: Tug's Nugs 2023
    ('36638702', '1111213'),  -- Flight Path - Creatures 2018-2025
    ('36445272', '1106276'),  -- 2/8/25 EMG>6/29/25 AIN>2/7/25 Madhuvan>2/14/
    ('36235204', '1099838'),  -- 6/28/24 Tumble>6/8/24 Madhuvan>4/7/24 Drive>
    ('36235193', '1099837'),  -- 6/22/23 Borne>3/24/23 Echo>4/14/23 Hungersit
    ('36235186', '1099836'),  -- 6/10/22 AIN>6/15/22 Madhuvan>1/30/22 Wysteri
    ('36235172', '1099835'),  -- 6/15/21 AWS>6/19/21 Moby>Madhuvan>6/11/21 Ar
    ('36191300', '1098269'),  -- 6/28/25 Thatch>5/28/25 DH>6/6/25 FF>6/22/25 
    ('36235162', '1099834'),  -- 9/16/20 Madhuvan>9/17/20 Rosewood>6/26/20 FF
    ('36191290', '1098267'),  -- 6/28/25 FF>8/28/25 Creatures>6/19/25 Torero>
    ('36070188', '1094646'),  -- OnlyJams Mix by @TugMartin: Tug's Nugs, 2025
    ('36143454', '1096684'),  -- This Old Sea: 6/28/20>2/7/22>7/23/21>4/7/24>
    ('36191264', '1098264'),  -- 8/16/25 Echo>6/29/25 AIN>6/27/25 Rockdale>6/
    ('34625706', '1046709'),  -- 02/13/25 Half-Step > 05/31/25 AIN
    ('34553852', '1044939'),  -- OnlyJams Mix by @TugMartin: Tug's Nugs, All 
    ('34553853', '1044942'),  -- OnlyJams Mix by @TugMartin: Tug's Nugs, All 
    ('34297767', '1036339'),  -- Flight Path - Rosewood Heart Recap
    ('34297768', '1036339'),  -- Flight Path - Rosewood Heart Intro
    ('34297774', '1036339'),  -- Flight Path - Rosewood Heart - 2019-2025
    ('34298012', '1036346'),  -- Flight Path - Hot Tea Recap
    ('34298013', '1036346'),  -- Flight Path - Hot Tea Intro
    ('34298014', '1036346'),  -- Flight Path - Hot Tea 2018 thru 2025
    ('34035075', '1027142'),  -- Flight Path - Elizabeth 2018 thru 2025
    ('34034894', '1027124'),  -- Flight Path - Drive 2019 thru 2025
    ('34028830', '1026948'),  -- Flight Path - Time to Flee 2019-2025
    ('33765600', '1019113'),  -- Only Jams-BenJamminSatellites-Feb. 2025, Set
    ('33812315', '1020456'),  -- CabOnlyJams Mix Part 1 by Brett @WaltonsJoin
    ('33509109', '1010484'),  -- Only Jams-BenJamminSatellites-Feb. 2025, Set
    ('33569683', '1012477'),  -- Introduction with Kyle - Everything Must Go
    ('30485504', '910522'),  -- Arrow > Arrow Reprise
    ('31062452', '895203'),  -- January through June 2022 Part 2 OnlyJams Mi
    ('31062453', '895204'),  -- January through June 2022 Pt 3 OnlyJams Mix 
    ('31062457', '895202'),  -- January through June 2022 Pt 1 OnlyJams Mix 
    ('30690214', '920173'),  -- June 2024 Vickers Bliss List OnlyJams Mix Pt
    ('30690207', '920144'),  -- June 2024 Vickers Bliss List OnlyJams Mix Pt
    ('29986195', '897563'),  -- Tab Tour Sit-ins OnlyJams Mix by @WaltonsJoi
    ('29928096', '895181'),  -- High AltiTed Pt 1 OnlyJams Mix by @WaltonsJo
    ('29928114', '895183'),  -- High AltiTed Pt 2 OnlyJams Mix by @WaltonsJo
    ('29928181', '895184'),  -- High AltiTed OnlyJams Mix Pt 3 by @WaltonsJo
    ('29944006', '897562'),  -- 2021 OnlyJams Mix by @WaltonsJoint Pt 1
    ('29927881', '895166'),  -- Capitol Theater 2024 Pt 1 OnlyJams Mix by Br
    ('29927935', '895167'),  -- Capitol Theater 2024 Pt 2 OnlyJams Mix by Br
    ('29927975', '895168'),  -- Capitol Theater 2024 Pt 3 OnlyJams Mix by Br
    ('32876845', '989561'),  -- Milwaukee 2025 OnlyJams Mix by @WaltonsJoint
    ('32937988', '996281'),  -- 2022 Bliss OnlyJams Mix by Marc Whitman
    ('32937991', '996282'),  -- Goose 2024 Bliss Jams
    ('32938008', '996283'),  -- Goose 2024 power jams, vol 1
    ('33338724', '1004943'),  -- Tug's Nugs: February 2025 Peak Jams(Only) Vo
    ('33338725', '1004493'),  -- Tug's Nugs: February 2025 Peak Jams(Only), V
    ('33569684', '1012477'),  -- Intermission with Kyle - Everything Must Go
    ('33569685', '1012477'),  -- Thanks for Listening! - Everything Must Go
    ('33858373', '1021773'),  -- Flight Path - Wysteria Lane 2018-2024
    ('33858409', '1021774'),  -- Flight Path - All I Need 2018-2025
    ('33858430', '1021771'),  -- Flight Path - Madhuvan 2018-2025
    ('34329690', '1127887'),  -- OnlyJams Mix by @Tug Martin: Tug's Nugs, 202
    ('34329723', '1036753'),  -- OnlyJams Mix by @ TugMartin: Tug's Nugs, 202
    ('34329733', '1036750'),  -- OnlyJams Mix by @TugMartin: Tug's Nugs, All 
    ('36191276', '1098266'),  -- 5/30/25 Thatch>6/27/25 FITS>6/1/25 Rosewood>
    ('37693838', '1139965'),  -- Burn The Witch
    ('37527985', '1135991'),  -- Ep 1.J. #32
    ('37527986', '1135991'),  -- Ep 1.F. #36
    ('37527987', '1135991'),  -- Ep 1.I. #33
    ('37527988', '1135991'),  -- Ep 1.K #31
    ('37527989', '1135991'),  -- Ep 1.E. #37
    ('37527990', '1135991'),  -- Ep1.L Outro
    ('37527991', '1135991'),  -- Ep 1.C. #39 w Shawna
    ('37527992', '1135991'),  -- Ep 1.B. #40
    ('37527993', '1135991'),  -- Ep 1.H. #34
    ('37527994', '1135991'),  -- Ep 1.D. #38
    ('37527995', '1135991'),  -- Ep 1.G. #35 w Martyna
    ('37527996', '1135991'),  -- Ep 1.A Origin Story
    ('37571919', '1136729'),  -- Ep 2 I #22
    ('37571920', '1136729'),  -- Ep 2 J #21
    ('37571921', '1136729'),  -- Ep 2 E #26
    ('37571922', '1136729'),  -- Ep 2 B #29
    ('37571923', '1136729'),  -- Ep 2 G #24
    ('37571924', '1136729'),  -- Ep 2 A #30
    ('37571925', '1136729'),  -- Ep 2 K Outro
    ('37571926', '1136729'),  -- Ep 2 F #25 w Lizzy
    ('37571927', '1136729'),  -- Ep 2 D #27 w Nicole
    ('37571928', '1136729'),  -- Ep 2 C #28
    ('37571929', '1136729'),  -- Ep 2 H #23
    ('37620145', '1138225'),  -- Ep 3. J #12
    ('37620146', '1138225'),  -- Ep 3. E #17
    ('37620147', '1138225'),  -- Ep 3. L Outro
    ('37620148', '1138225'),  -- Ep 3. G #15
    ('37620149', '1138225'),  -- Ep 3. B #20
    ('37620150', '1138225'),  -- Ep 3. C #19
    ('37620151', '1138225'),  -- Ep 3. D #18  w Jill
    ('37620152', '1138225'),  -- Ep 3. I #13
    ('37620153', '1138225'),  -- Ep 3. F #16
    ('37620154', '1138225'),  -- Ep 3. H #14
    ('37620155', '1138225'),  -- Ep 3. K #11 w Maya
    ('37693800', '1139965'),  -- Ep 4. B #9
    ('37693801', '1139965'),  -- Ep 4. H #3
    ('37693802', '1139965'),  -- Ep 4. A #10
    ('37693803', '1139965'),  -- Ep 4. E #6
    ('37693804', '1139965'),  -- Ep 4. I #2
    ('37693805', '1139965'),  -- Ep 4. F #5
    ('37693806', '1139965'),  -- Ep 4. C #8
    ('37693807', '1139965'),  -- Ep 4. G #4
    ('37693808', '1139965'),  -- Ep 4. J #1 w Trisha
    ('37693810', '1139965'),  -- Ep 4. D #7 w Erica
    ('34076194', '1028692'),  -- Creatures with Brittany aka EmpressCreature
    ('34076195', '1028692'),  -- DLMTW with Brittany aka EmpressCreature
    ('34076196', '1028692'),  -- Intro with Brittany aka EmpressCreature
    ('34076197', '1028692'),  -- Conclusion Cincy Engborg with Brittany aka E
    ('34335669', '1037750'),  -- Fast_Slow with Brittany aka EmpressCreature
    ('34335666', '1037750'),  -- Intro with Brittany aka EmpressCreature
    ('34335667', '1037750'),  -- Tumble with Brittany aka EmpressCreature
    ('34335668', '1037750'),  -- Psycho killer echo with Brittany aka Empress
    ('34335665', '1037750'),  -- Sign off with Brittany aka EmpressCreature
    ('29665734', '885866'),  -- GooseBusters Outro with @Kyle
    ('29665740', '885866'),  -- GooseBusters Set Break with @Kyle
    ('29665717', '885866'),  -- GooseBusters Set Break with @Kyle
    ('29665719', '885866'),  -- GooseBusters Set Break with @Kyle
    ('29665726', '885866'),  -- GooseBusters Introduction with @Kyle
    ('27255403', '814275'),  -- Black Muddy River - 1990/03/04 Capital Centr
    ('27255405', '814275'),  -- Standing on the Moon
    ('27255408', '814275'),  -- Morning Dew - 1977/05/08 Barton Hall, Cornel
    ('32761245', '845038'),  -- Intro w/ Tug Martin
    ('32761246', '845038'),  -- Recap w/ Tug Martin
    ('32761337', '845043'),  -- Intro w/ Tug Martin
    ('32761338', '845043'),  -- Recap w/ Tug Martin
    ('32761464', '845046'),  -- Intro w/ Tug Martin
    ('32761465', '845046'),  -- Recap w/ Tug Martin
    ('31698030', '951057'),  -- Intro w/ Ben and Dean
    ('31698031', '951057'),  -- Set Break w/ Ben and Dean
    ('37477352', '1135464'),  -- Break w/ Basty & Annie
    ('37477353', '1135464'),  -- Closing w/ Basty
    ('37477354', '1135464'),  -- Break w/ Basty & Ben
    ('37477355', '1135464'),  -- Break w/ Basty & Eric
    ('37477356', '1135464'),  -- Break w/ Basty & Shawna
    ('37477357', '1135464'),  -- Break w/ Basty & Brett
    ('37477358', '1135464'),  -- Intro w/ Basty & Beth
    ('28992213', '865517'),  -- Intro by Tug Martin @OldManRising
    ('28992215', '865517'),  -- Set Break by Tug Martin @OldManRising
    ('28250853', '842482'),  -- Break by Tug Martin @OldManRising
    ('28250854', '842482'),  -- Intro by Tug Martin @OldManRising
    ('28285490', '845025'),  -- Recap by Tug Martin @OldManRising
    ('28285488', '845025'),  -- Intro by Tug Martin @OldMan Rising
    ('28285489', '845025'),  -- Break by Tug Martin @OldManRising
    ('28992214', '865517'),  -- Recap by Tug Martin @OldManRising
    ('28994707', '865519'),  -- Recap by Tug Martin @OldManRising
    ('28994708', '865519'),  -- Break by Tug Martin @OldManRising
    ('28994709', '865519'),  -- Intro by Tug Martin @OldManRising
    ('29666442', '865522'),  -- Break by Tug Martin @OldManRising
    ('29666443', '865522'),  -- Intro by Tug Martin @OldManRising
    ('29666444', '865522'),  -- Recap by Tug Martin @OldManRising
    ('28284248', '845052'),  -- Recap by Tug Martin @OldMan Rising
    ('28284288', '845052'),  -- Intro by Tug Martin @ Old Man Rising
    ('28284406', '845052'),  -- Break by Tug Martin @OldManRising
    ('28993107', '865489'),  -- Intro by Tug Martin @OldManRising
    ('28993109', '865489'),  -- Break by Tug Martin @OldManRising
    ('28993113', '865489'),  -- Recap by Tug Martin @OldManRising
    ('28284719', '842470'),  -- Break by Tug Martin @OldManRising
    ('28284720', '842470'),  -- Intro by Tug Martin @OldManRising
    ('28284721', '842470'),  -- Recap by Tug Martin @OldManRising
    ('28285335', '845070'),  -- Break by Tug Martin @OldManRising
    ('28285336', '845070'),  -- Intro by Tug Martin @OldManRising
    ('28285337', '845070'),  -- Recap by Tug Martin @OldManRising
    ('31598723', '948087'),  -- Recap by Tug Martin @OldManRising
    ('31598725', '948087'),  -- Intro by Tug Martin @OldManRising
    ('31598726', '948087'),  -- Break by Tug Martin @OldManRising
    ('31599700', '948112'),  -- Break by Tug Martin @OldManRising
    ('31599701', '948112'),  -- Intro by Tug Martin @OldManRising
    ('31599702', '948112'),  -- Recap by Tug Martin @OldManRising
    ('31600413', '948119'),  -- Break by Tug Martin @OldManRising
    ('31600414', '948119'),  -- Intro by Tug Martin @OldManRising
    ('31600415', '948119'),  -- Recap by Tug Martin @OldManRising
    ('27471706', '820942'),  -- Introduction by Michael @mjbasty1
    ('27471750', '820942'),  -- Set Break by Michael @mjbasty1
    ('31953894', '958977'),  -- Intro with Brett @WaltonsJoint
    ('27469885', '820942'),  -- It Doesn't Matter - 2019/11/02 The Fillmore,
    ('31304758', '937282'),  -- Jam Art Mix
    ('27255399', '814275'),  -- Deal - 1982/06/18 Cape Cod Coliseum, Cape Co
    ('27255763', '814275'),  -- Knockin' On Heaven's Door - 1987/10/28, Lunt
    ('28895520', '863478'),  -- Recap w/ Peter @TX_Goosefan
    ('28895521', '863478'),  -- Intro w/ Peter @TX_Goosefan
    ('29396727', '878017'),  -- Recap w/Peter @Tx_Goosefan
    ('29396728', '878017'),  -- Break w/ Peter @Tx_Goosefan
    ('29396730', '878017'),  -- Intro w/ Peter @Tx_Goosefan
    ('28311671', '845171'),  -- Holiday Honk Hour - Thank you and Happy Holi
    ('28311685', '845171'),  -- Holiday Honk Hour - Serving the Community
    ('28311833', '845171'),  -- Holiday Honk Hour - Introduction by Kyle @Ky
    ('28311894', '845171'),  -- Holiday Honk Hour - Holidays with Kids
    ('28311915', '845171'),  -- Holiday Honk Hour - Discovering Live Music
    ('31913280', '957787'),  -- Recap w/ Dean
    ('31913281', '957787'),  -- Set Break w/ Sim
    ('31913285', '957787'),  -- Intro w/ Dean and Sim
    ('29741881', '889050'),  -- Break w/ @SimTurner
    ('29741882', '889050'),  -- Break w/ @SimTurner
    ('29741883', '889050'),  -- Break w/ @SimTurner
    ('29741884', '889050'),  -- Break w/ @SimTurner
    ('29741877', '889050'),  -- Break w/ @SimTurner
    ('29741878', '889050'),  -- Break w/ @SimTurner
    ('29741879', '889050'),  -- Set Break w/ @SimTurner
    ('29741880', '889050'),  -- Break w/ @SimTurner
    ('29741871', '889050'),  -- Break w/ @SimTurner
    ('29741872', '889050'),  -- Break w/ @SimTurner
    ('29741873', '889050'),  -- FIN w/ @SimTurner
    ('29741874', '889050'),  -- Break w/ @SimTurner
    ('29741875', '889050'),  -- Break w/ @SimTurner
    ('29741876', '889050'),  -- Break w/ @SimTurner
    ('29741870', '889050'),  -- Intro w/ @SimTurner
    ('30873149', '924388'),  -- Intro w/ Ben @btrot281
    ('30873150', '924388'),  -- Set Break1 w/ Ben @btrot281
    ('30873151', '924388'),  -- Set Break 2 w/ Ben @btro281
    ('32856515', '984638'),  -- Closing Thoughts w/ @DeanNovin and @Ben Chas
    ('32856516', '984638'),  -- Intermission w/ @BenChasingSatellites
    ('32856517', '984638'),  -- Intro w/ @DeanNovin
    ('28137469', '840757'),  -- Recap w/ Peter @Tx_goosefan
    ('28137470', '840757'),  -- Intro w/ Peter @Tx_goosefan
    ('28137471', '840757'),  -- Set Break w/ Peter @Tx_goosefan
    ('28336999', '847092'),  -- Intro by Michael @mjbasty1
    ('28337000', '847092'),  -- Recap by Michael @mjbasty1
    ('28337004', '847092'),  -- Set Break w/ Michael @mjbasty1
    ('33876627', '1022390'),  -- Intro w/Norm
    ('33876624', '1022390'),  -- Outro w/Norm
    ('33876625', '1022394'),  -- Outro w/Norm
    ('33876626', '1022394'),  -- Intro w/Norm
    ('29472781', '880107'),  -- Set Break w/ @SeannyMac
    ('29444724', '879252'),  -- Recap w/Brendan @Madgruvan
    ('29444725', '879252'),  -- Intro w/Brendan @Madgruvan
    ('29444726', '879252'),  -- Set Break w/Brendan @Madgruvan
    ('29472778', '880107'),  -- Encore w/ @SeannyMac
    ('29472780', '880107'),  -- Intro w/ @SeannyMac
    ('32466212', '975846'),  -- Encore Break w/ Ben
    ('32466216', '975846'),  -- Intro w/ Ben
    ('32472488', '975846'),  -- Set Break w/ Ben
    ('27563555', '821317'),  -- Break by Tug @OldManRising
    ('27563556', '821317'),  -- Intro by Tug @OldManRising
    ('27630175', '825923'),  -- Recap by Tug @OldManRising
    ('27630176', '825923'),  -- Break by Tug @OldManRising
    ('27630177', '825923'),  -- Intro by Tug @OldManRising
    ('27563557', '821317'),  -- Recap by Tug @OldManRising
    ('32352127', '972135'),  -- Recap w/ Norm
    ('32352129', '972135'),  -- Intro w/ Norm
    ('32352130', '972135'),  -- Set Break w/ Norm
    ('30267437', '895181'),  -- Only Jams
    ('30267438', '895183'),  -- Only Jams
    ('30267436', '895184'),  -- Only Jams
    ('32883942', '989561'),  -- Onlyjams
    ('30316943', '906998'),  -- Break w/Dean
    ('30316944', '906998'),  -- Intro w/ Dean
    ('30316946', '906998'),  -- Break w/Dean
    ('30316947', '906998'),  -- Break w/Dean
    ('30316948', '906998'),  -- Break w/Dean
    ('30316949', '906998'),  -- Break w/Dean
    ('32351465', '972117'),  -- Sim Turner Perfect June 24 s2 AND Encore
    ('32351588', '972114'),  -- Sim Turner Perfect June 24 Set 1
    ('32351458', '972114'),  -- SimTurner Perfect June 24 Show S1 Closing
    ('28653688', '856105'),  -- Break w/ Michael @mjbasty1
    ('28653748', '856105'),  -- Love from Kyle @kyle
    ('28654232', '856105'),  -- Thanks Ben w/ @BeefofAges
    ('28654319', '856105'),  -- Break w/Norm @Norm
    ('28654828', '856105'),  -- Break w/Michael @mjbasty1
    ('28654935', '856105'),  -- Break w/Peter @Tx_Goosefan
    ('28655648', '856105'),  -- Break w/Sim @simturner
    ('28658279', '856105'),  -- Break w/ Brendan @madgruvan
    ('28658461', '856105'),  -- Break w/Adam @6R0M7
    ('28658532', '856105'),  -- Outro by Michael @mjbasty1
    ('28660286', '856105'),  -- Break w/ TUG @oldmanrising
    ('28667251', '856105'),  -- Break w/ Mike @jambandjovi
    ('28671701', '856105'),  -- Intro by Michael @mjbasty1
    ('28671761', '856105'),  -- Love from Kara @karayates
    ('32780142', '986107'),  -- 2nd Quarter w/ Ben
    ('32780143', '986107'),  -- 1st Quarter w/ Ben
    ('32780140', '986108'),  -- 4th Quarter w/ Ben
    ('32780141', '986108'),  -- 3rd Quarter with Ben
    ('37364393', '1132342'),  -- 11_Closing w/ Big Mig & Sixtus
    ('37364399', '1132342'),  -- Intro w/ Big Mig & Sixtus
    ('34170351', '1139965'),  -- TeesThatJam.com
    ('31376543', '1031974'),  -- Support WTED @ WTEDradio.com
    ('27269078', '814583'),  -- Up On Cripple Creek (Hi Res Version)
    ('27269081', '814583'),  -- Theme From The Last Waltz (With Orchestra) (
    ('27269082', '814583'),  -- Chest Fever
    ('27269089', '814583'),  -- The Last Waltz Refrain  (Hi Res Mix Version)
    ('27269096', '814583'),  -- Ophelia (Hi Res Mix Version)
    ('27269102', '814583'),  -- The Weight (Hi Res Version)
    ('34421193', '1040141'),  -- Days Between - 1993/03/17 Capital Centre, La
    ('34128953', '917656'),  -- Cold Rain and Snow - 1989/07/04 Rich Stadium
    ('34421197', '1040141'),  -- Set Break w/Dean
    ('34421202', '1040141'),  -- Dead Set 3 w/Dean
    ('34421203', '1040141'),  -- Dead Set 2 w/Dean
    ('34421204', '1040141'),  -- Dead Set 1 w/Dean
    ('37742744', '1140941'),  -- Dead Set 1 w/Dean
    ('37729812', '1140941'),  -- Dead Set 7 w/Dean
    ('37729813', '1140941'),  -- Dead Set 4 w/Dean
    ('37729814', '1140941'),  -- Dead Set 6 w/Dean
    ('37729815', '1140941'),  -- Dead Set 2 w/Dean
    ('37729817', '1140941'),  -- Dead Set 3 w/Dean
    ('37729818', '1140941'),  -- Dead Set 8 w/Dean
    ('37729811', '1140941'),  -- Dead Set 5 w/Dean
    ('36656071', '877328'),  -- Outro w/Dean
    ('36656072', '877328'),  -- Set Break w/Dean
    ('36656075', '877328'),  -- Intro w/Dean
    ('34077426', '941726'),  -- Intro w/Dean
    ('34077427', '941726'),  -- Outro w/Dean
    ('34077841', '941726'),  -- Set Break w/Dean
    ('34299332', '1036385'),  -- Intro w/Dean
    ('34299334', '1036385'),  -- Outro w/Dean
    ('34299335', '1036385'),  -- Set Break w/Dean
    ('34361038', '1038535'),  -- Intro w/Dean
    ('34361039', '1038535'),  -- Outro w/Dean
    ('34361040', '1038535'),  -- Set Break w/Dean
    ('34855329', '1054230'),  -- Intro w/Dean
    ('34855330', '1054230'),  -- Set Break w/Dean
    ('34855331', '1054230'),  -- Outro w/Dean
    ('35331967', '1071019'),  -- Set Break w/Dean
    ('35331968', '1071019'),  -- Intro w/Dean & Gary
    ('35331969', '1071019'),  -- Outro w/Dean
    ('35026779', '1060837'),  -- Set Break w/Dean
    ('35026780', '1060837'),  -- Intro w/Dean and Nate
    ('35026782', '1060837'),  -- Outro w/Dean
    ('34644848', '1046903'),  -- Outro w/Dean
    ('34644849', '1046903'),  -- Intro w/Dean
    ('34644851', '1046903'),  -- Set Break w/Dean
    ('36768560', '874818'),  -- Outro w/Dean
    ('36768561', '874818'),  -- Set Break 4 w/Dean
    ('36768562', '874818'),  -- Set Break 2 w/Dean
    ('36768563', '874818'),  -- Set Break 5 w/Dean
    ('36768564', '874818'),  -- Intro w/Dean
    ('36768565', '874818'),  -- Set Break 3 w/Dean
    ('36768566', '874818'),  -- Set Break 6 w/Dean
    ('36768567', '874818'),  -- Set Break 7 w/Dean
    ('36768568', '874818'),  -- Set Break 1 w/Dean
    ('35756989', '1085137'),  -- Intro w/Dean
    ('35756990', '1085137'),  -- Outro w/Dean
    ('35756991', '1085137'),  -- Set Break 2 w/Dean
    ('35756992', '1085137'),  -- Set Break 3 w/Dean
    ('35757211', '1085137'),  -- Set Break 4 w/Dean
    ('35756988', '1085137'),  -- Set Break 1 w/Dean
    ('34745802', '1050330'),  -- Intro w/Dean
    ('34745803', '1050330'),  -- Set Break w/Dean & Neal
    ('34745804', '1050330'),  -- Outro w/Dean
    ('35143020', '1064843'),  -- Set Break w/Dean
    ('35143021', '1064843'),  -- Set Break 2 w/Dean
    ('35143022', '1064843'),  -- Outro w/Dean
    ('35143023', '1064843'),  -- Intro w/Dean
    ('34128950', '917656'),  -- Intro w/Dean
    ('34128951', '917656'),  -- Set Break w/Dean
    ('34128952', '917656'),  -- Outro w/Dean
    ('35665201', '1081818'),  -- Intro w/Dean
    ('35665203', '1081818'),  -- Set Break w/Dean
    ('35665205', '1081818'),  -- Outro w/Dean
    ('36691989', '1112457'),  -- Intro w/Dean
    ('36691990', '1112457'),  -- Set Break 2 w/Dean
    ('36691987', '1112457'),  -- Outro w/Dean
    ('36691988', '1112457'),  -- Set Break 1 w/Dean
    ('35912496', '1089885'),  -- Part 3 w/Dean
    ('35912497', '1089885'),  -- Part 4 w/Dean
    ('35912972', '1089885'),  -- Part 2 w/Dean
    ('35912986', '1089885'),  -- Part 6 w/Dean
    ('35913006', '1089885'),  -- Outro w/Dean
    ('35905543', '1089885'),  -- Intro w/Dean
    ('35912495', '1089885'),  -- Part 5 w/Dean
    ('33789573', '1050643'),  -- Set Break w/Dean
    ('33789574', '1050643'),  -- Outro w/Dean
    ('33789575', '1050643'),  -- Set Break w/Basty, Sim, and Dean
    ('33762157', '1050643'),  -- Intro w/Dean, Sim, and Basty
    ('33762319', '1050643'),  -- Break w/Drew @SteelyDrew
    ('33762320', '1050643'),  -- Break w/Andrew Duddy
    ('36143453', '1096684'),  -- Intro w/Ben
    ('36953405', '1119827'),  -- Three That Moved Me - Arcadia Intro
    ('36953406', '1119827'),  -- Three That Moved Me - Elmeg Intro
    ('36953407', '1119827'),  -- Three That Moved Me - Recap
    ('36953408', '1119827'),  -- Three That Moved Me - Intro
    ('34555169', '1043740'),  -- Under The Covers with Kaz - Killing Moon
    ('34555170', '1043740'),  -- Under The Covers With Kaz - In Your Eyes
    ('34555171', '1043740'),  -- Under the Covers With Kaz - Closing
    ('34555163', '1043740'),  -- Under The Covers with Kaz - AEIOU
    ('34555165', '1043740'),  -- Under The Covers with Kaz - Fish In The Sea
    ('34555166', '1043740'),  -- Under The Covers with Kaz - Hollywood Nights
    ('34555167', '1043740'),  -- Under The Covers with Kaz - 99 Red Baloons
    ('34555168', '1043740'),  -- Under The Covers with Kaz - Sinnerman
    ('34555162', '1043740'),  -- Under The Covers with Kaz - Amongster
    ('34555157', '1043740'),  -- Under The Covers with Kaz - True Love Waits
    ('34555158', '1043740'),  -- Under The Covers with Kaz - I Would Die 4 U
    ('34555160', '1043740'),  -- Under The Covers with Kaz - Bloodbuzz Ohio
    ('34555161', '1043740'),  -- Under The Covers with Kaz - Half Step
    ('34555156', '1043740'),  -- Under The Covers with Kaz - Escape
    ('34555154', '1043740'),  -- Under The Covers with Kaz - C&P
    ('34555152', '1043740'),  -- Under The Covers with Kaz - Don't Do It
    ('34555153', '1043740'),  -- Under The Covers with Kaz - Whats Up
    ('34555151', '1043740'),  -- Under The Covers with Kaz - Intro and No Cal
    ('34563905', '1043721'),  -- Hungersite w/ Kyle
    ('34563906', '1043721'),  -- The Way It Is w/ Kyle
    ('34563907', '1043721'),  -- Seekers on The Ridge w/ Kyle
    ('34562081', '1043721'),  -- Dustin Hoffman w/ Basty
    ('34562076', '1043721'),  -- Arcadia w/ @Garntd
    ('34562077', '1043721'),  -- Animal w/ Basty
    ('34562078', '1043721'),  -- The Empress of Organos w/ @Garntd
    ('34562080', '1043721'),  -- Intro & Arrow w/ @Garntd
    ('33858362', '1021771'),  -- Flight Path - Madhuvan Recap
    ('33858363', '1021773'),  -- Flight Path - Wysteria Lane Intro
    ('33858364', '1021774'),  -- Flight Path - All I Need Intro
    ('33858365', '1021771'),  -- Flight Path - Madhuvan Intro
    ('33858366', '1021774'),  -- Flight Path - All I Need Recap
    ('33858367', '1021773'),  -- Flight Path - Wysteria Lane Recap
    ('37315985', '1136729'),  -- Ah Shit Rick
    ('34034890', '1027124'),  -- Flight Path - Drive - Recap
    ('34035073', '1027142'),  -- Flight Path - Elizabeth - Intro
    ('34035074', '1027142'),  -- Flight Path - Elizabeth - Recap
    ('34028828', '1026948'),  -- Flight Path - Time to Flee - Intro
    ('34028829', '1026948'),  -- Flight Path - Time to Flee - Recap
    ('34034889', '1027124'),  -- Flight Path - Drive - Intro
    ('33675559', '1139965'),  -- Andy Frasco Thanks You For Listening
    ('32853953', '1002811'),  -- Eric Loomis Thanks You for Listening!
    ('32854820', '1139965'),  -- cotterStans
    ('31037436', '1043721'),  -- Thanks For Listening!
    ('31174314', '1047141'),  -- Thank You For Listening!
    ('31230094', '934592'),  -- Set Break with Kyle
    ('31230095', '934592'),  -- Set Break with Kyle
    ('31230097', '934592'),  -- Introduction with Kyle
    ('31230103', '934592'),  -- Set Break with Kyle
    ('31230107', '934592'),  -- Set Break with Kyle
    ('30706755', '986250'),  -- Drunk Orsen Wells Thanks You For Listening
    ('30485454', '910522'),  -- Thank You for Listening to Dripfield Live wi
    ('30338358', '1099709'),  -- Little Yeti Thanks You For Listening
    ('30127988', '937282'),  -- Thanks For Listening!
    ('29479424', '880436'),  -- Southern Fried Goose
    ('29481471', '826922'),  -- Kentucky Mix
    ('29481530', '815848'),  -- Drive In Mix
    ('29487173', '865517'),  -- Thanks For Listening
    ('27454289', '820942'),  -- Thanks For Listening
    ('29130064', '827501'),  -- Horny and Saxy
    ('29203727', '826919'),  -- Masshole Jams
    ('29311985', '889050'),  -- Thanks For Listening
    ('29368508', '823817'),  -- California Magic Intro
    ('31677204', '949765'),  -- Recap w/ Dean
    ('31956222', '970047'),  -- Thanks for Listening!
    ('32512008', '1047141'),  -- Thanks For Listening!
    ('32527653', '1099711'),  -- Remembering Milwaukee 2025
    ('32621601', '982322'),  -- Thanks For Listening!
    ('32999913', '946878'),  -- Thank you for Listening!
    ('33082952', '844964'),  -- Euro Tour Mix
    ('33084003', '996282'),  -- 2024 Bliss Jams Intro by Whit
    ('33084004', '996283'),  -- 2024 Power Jams Intro by Whit
    ('33084005', '996281'),  -- 2022 Bliss Jams Intro by Whit
    ('35195151', '1067168'),  -- Starship 21 Ep. 1 - Thanks for Listening!
    ('35195152', '1067168'),  -- Starship 21 - SC > WI - Setbreak with Kyle
    ('35195153', '1067168'),  -- Starship 21 - Ep. 1 - Introduction with Kyle
    ('35195154', '1067168'),  -- Starship 21 - WI > MA - Setbreak with Kyle
    ('35342121', '1071392'),  -- Starship 21 Ep 2 - Thanks for Listening!
    ('35342124', '1071392'),  -- Starship 21 Ep 2 - Set Break with Kyle - TN 
    ('35342125', '1071392'),  -- Starship 21 Ep 2 - Set Break with Kyle - FL 
    ('35342126', '1071392'),  -- Starship 21 Ep 2 - Introduction with Kyle
    ('35411044', '1073083'),  -- Starship 21 Ep 3 - Thanks for Listening!
    ('35411045', '1073083'),  -- Starship 21 Ep 3 - Introduction with Kyle
    ('35411046', '1073083'),  -- Starship 21 Ep 3 - Set Break with Kyle - CO 
    ('35453875', '1074864'),  -- Starship 21 Episode 4 - NH > OH
    ('35453876', '1074864'),  -- Starship 21 Episode 4 - WV > NH
    ('35453877', '1074864'),  -- Starship 21 Episode 4 - Introduction with Ky
    ('35453878', '1074864'),  -- Starship 21 Episode 4 - Thanks for Listening
    ('35544133', '1077548'),  -- Starship 21 Ep 5 - Thanks for Listening!
    ('35544134', '1077548'),  -- Starship 21 Ep 5 - Introduction with Kyle
    ('35544135', '1077548'),  -- Starship 21 Ep 5 - MD > NYC
    ('35568650', '1099711'),  -- Thanks For Listening
    ('35569373', '1136729'),  -- Thanks For Listening!
    ('29623519', '884977'),  -- Intro w/ Norm and Ben
    ('29623520', '884977'),  -- Set Break w/ Ben and Norm
    ('36307380', '1041298'),  -- Recap w/Norm & Ben
    ('34463871', '1041298'),  -- Set Break w/Norm and Ben
    ('34463872', '1041298'),  -- Intro w/Norm and Ben
    ('27064508', '864113'),  -- Thanks For Listening
    ('27277498', '814583'),  -- In Memoriam: Robbie Robertson
    ('27878328', '1115191'),  -- Thanks For Listening
    ('27950452', '856105'),  -- Thanks For Listening
    ('29046647', '862561'),  -- Thanks For Listening
    ('29110153', '1043721'),  -- Download the App!
    ('29332969', '822578'),  -- Showhio Mix
    ('29333304', '844964'),  -- Euro Tour Mix
    ('29407210', '810341'),  -- Little Yeti Thanks You For Listening To The 
    ('34626917', '1046709'),  -- Rosewood w/ Sim
    ('34645415', '1046709'),  -- Elizabeth w/ Basty
    ('34626098', '1046709'),  -- Break w/ Ben
    ('34621608', '1046709'),  -- Intro w/ Basty
    ('33273891', '1002811'),  -- Everything Must Go w/Ciano
    ('33273892', '1002811'),  -- Rosewood Heart w/Alex
    ('33273894', '1002811'),  -- Madhuvan w/Jeremy
    ('33273895', '1002811'),  -- Set Break w/Dean and Libby
    ('33273896', '1002811'),  -- New Speedway Boogie w/Ben
    ('33273897', '1002811'),  -- Intro  w/Dean and David Tracer
    ('33273900', '1002811'),  -- Echo of a Rose w/P Harris
    ('33273901', '1002811'),  -- Outro w/Dean and Sean @SeannyMac
    ('33273887', '1002811'),  -- Last Train Home w/Clark
    ('33273888', '1002811'),  -- True Love Waits w/Sim Turner
    ('33273889', '1002811'),  -- It Burns Within w/Mike
    ('33273890', '1002811'),  -- Dim Lights w/Beth @LSLady
    ('33317160', '1002811'),  -- A Message from Dean
    ('33558346', '946878'),  -- Intro w/Dean
    ('33558347', '946878'),  -- Outro w/Dean
    ('33558348', '946878'),  -- Set Break w/Dean
    ('33676196', '1016295'),  -- Outro w/Dean
    ('33676197', '1016295'),  -- Set Break 2 w/Dean
    ('33676201', '1016295'),  -- Set Break 3 w/Dean
    ('33676202', '1016295'),  -- Set Break 1 w/Dean
    ('33676203', '1016295'),  -- Set Break 4 w/Dean
    ('33676206', '1016295'),  -- Intro w/Dean
    ('33614466', '1014195'),  -- Outro w/Dean
    ('33614467', '1014195'),  -- Set Break w/Dean
    ('33614468', '1014195'),  -- Intro w/Dean
    ('33377446', '895320'),  -- Outro w/Dean
    ('33377447', '895320'),  -- Set Break w/Dean
    ('33377448', '895320'),  -- Intro w/Dean
    ('33450975', '1006732'),  -- Outro w/Dean
    ('33450976', '1006732'),  -- Set Break 1 w/Dean
    ('33450972', '1006732'),  -- Set Break 3 w/Dean
    ('33450973', '1006732'),  -- Intro w/Dean
    ('33450974', '1006732')   -- Set Break 2 w/Dean
) as v(radio_id, wted_show_id)
where w.radio_id = v.radio_id
  and w.show_id is null
  and w.wted_show_id is null;

-- ── 3. backfill: show_id (concerts) ─────────────────────────────────────────
update public.wted_radio_ids w
set    show_id = v.show_id::uuid
from  (values
    ('34770161', 'f2a4e948-52a2-4e06-b382-1d7018d12c51'),  -- Intro with Brett @WaltonsJoint
    ('34770162', 'f2a4e948-52a2-4e06-b382-1d7018d12c51'),  -- Recap with Brett @WaltonsJoint
    ('37445142', 'c20f1628-aec1-456e-8113-272d0bce3490'),  -- Recap w/ Shawna
    ('37445143', 'c20f1628-aec1-456e-8113-272d0bce3490'),  -- Set Break w/ Shawna
    ('37445144', 'c20f1628-aec1-456e-8113-272d0bce3490'),  -- Intro w/ Shawna
    ('27238280', '42aa660c-7669-45ca-b207-445ff2f59411'),  -- Jerome Grown Goods on Etsy
    ('30076211', '12f1d0f8-0fef-471b-8862-e85dfa616679'),  -- CashorTrade.org
    ('32326943', '3d9645bb-6ed1-4553-8941-a87906f5b671'),  -- WTED Presents
    ('30103713', '9fbb9b17-9190-4b39-bc16-bbd93bd1fa82'),  -- etsy.com/shop/greatfulgumbo
    ('34177751', 'a5f09a23-5510-4b50-9c73-521f721b7246'),  -- The Way You Do the Things You Do - 1991/02/2
    ('33872778', 'b3d38b48-2420-4ed4-ba35-cdaf22011294'),  -- community.wysterialane.org
    ('33985208', '1dea64ad-29f0-4c5f-b85c-3a6be4b99a94'),  -- Wharf Rat - 1978/07/08 Red Rocks Ampitheatre
    ('27051589', 'dbc7e945-6aac-4fcc-84e6-de22b595df7e'),  -- Radio
    ('32227793', '38910369-63cb-4aa1-b592-cfc2057ba358'),  -- Bingo Tour 1 Closing
    ('32227795', '38910369-63cb-4aa1-b592-cfc2057ba358'),  -- Bingo Tour 1 Set Break
    ('32227796', '38910369-63cb-4aa1-b592-cfc2057ba358'),  -- Bingo Tour 1 Opening
    ('34111915', '39b9dd2b-7ddd-4ef1-8370-9c00b68a8920'),  -- Recap W Shawna
    ('34111916', '39b9dd2b-7ddd-4ef1-8370-9c00b68a8920'),  -- Set Break W Shawna
    ('34111917', '39b9dd2b-7ddd-4ef1-8370-9c00b68a8920'),  -- Intro W Shawna
    ('28877388', 'e394ff69-dac0-4e47-a3f8-c24eb1ad4563'),  -- First Wysterian Bank w/ @Kyle - Vault 1 Reca
    ('28877389', 'e394ff69-dac0-4e47-a3f8-c24eb1ad4563'),  -- First Wysterian Bank w/ @Kyle - Vault 1 Intr
    ('33274682', '02236079-66cb-40ac-8557-c19f3bb2266d'),  -- Luna Luna Closing Commentary w/ Sim Turner
    ('36794260', '66713c13-f47d-4ba9-904c-27853cea0849'),  -- Set Break w/ Casey
    ('36609830', '0e416d63-8d25-4c6c-9876-a002502800c0'),  -- Set Break w/ Tug
    ('36609831', '0e416d63-8d25-4c6c-9876-a002502800c0'),  -- Recap w/ Tug
    ('36609832', '0e416d63-8d25-4c6c-9876-a002502800c0'),  -- Intro w/ Tug
    ('35956910', '0eb5a3bd-c8ab-4078-baf6-a70cd39c884e'),  -- This is LarryHood78
    ('35666141', 'f74df5c0-65e3-435a-bac7-e7fc8671d238'),  -- This is LarryHood78
    ('34949520', 'ecf85006-3f0d-4ff5-a8a2-b65a8d2aab56'),  -- Thank You For Listening!
    ('33811760', '9e8d3390-5a87-4147-856a-22854c100ecb'),  -- Thank You for Listening!
    ('32866461', 'ecf85006-3f0d-4ff5-a8a2-b65a8d2aab56'),  -- Thanks For Listening
    ('31256021', 'a9fff1ce-5541-4c74-802a-17e0b2cae04a'),  -- Thank You For Listening!
    ('31501644', '45477923-6a41-444f-a114-5f4741ced58c'),  -- Adam Berta Thanks You For Listening
    ('32026097', '4d7192fe-0127-428b-99c6-9528d1a5c45a'),  -- Dave Matthews Intro Bumper
    ('33274686', '02236079-66cb-40ac-8557-c19f3bb2266d'),  -- Luna Luna Full Show (bootleg) Commentary wit
    ('33427735', '69738b20-012e-41b6-9ff4-5db85611e735'),  -- Outro with @SimTurner
    ('33427736', '69738b20-012e-41b6-9ff4-5db85611e735'),  -- Intro with @SimTurner
    ('33496375', '85c4d0ff-91e1-4e09-ac65-819ce1ff3b76'),  -- Intro w/Dean
    ('33496376', '85c4d0ff-91e1-4e09-ac65-819ce1ff3b76'),  -- Set Break w/Dean
    ('33496377', '85c4d0ff-91e1-4e09-ac65-819ce1ff3b76')   -- Outro w/Dean
) as v(radio_id, show_id)
where w.radio_id = v.radio_id
  and w.show_id is null
  and w.wted_show_id is null;

-- ── 4. verify before committing ─────────────────────────────────────────────
-- Baseline before this script: 8,821 rows, 7,790 with show_id, 1,031 without.
-- Expected after:
--     wted_show_id_total = 736
--     show_id_total      = 7,830   (7,790 + 40)
--     both_set           = 0       <- if this is not 0, ROLLBACK: the mutual
--                                     exclusivity rule was violated
--     neither_set        = 255     (159 tag-pulled + 96 ambiguous)
select
  count(*) filter (where wted_show_id is not null)                    as wted_show_id_total,
  count(*) filter (where show_id is not null)                         as show_id_total,
  count(*) filter (where show_id is not null and wted_show_id is not null) as both_set,
  count(*) filter (where show_id is null and wted_show_id is null)    as neither_set
from public.wted_radio_ids;

commit;
