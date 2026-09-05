# Teamcodes nach Liga

Nachschlage-Datei. **Quelle der Wahrheit** bleibt der jeweilige Katalog:

| Liga | Datei |
|---|---|
| DEL | `data/academy/teams.json` |
| DEL2 | `data/academy/teams_del2.json` |
| CHL | `data/academy/teams_chl.json` |
| U20_DNL | `data/academy/teams_u20_dnl.json` |
| NHL | `data/academy/teams_nhl.json` |
| Nationalmannschaften | `data/academy/teams_national.json` |
| Testspiele | `data/academy/teams_testspiele.json` |

Frontend-Spiegel: `frontend/src/data/teams_*.json` (DEL: `teams_del.json` ← `data/academy/teams.json`).

Kürzel gelten **immer nur innerhalb einer Liga**. Dieselbe Buchstabenfolge kann in einer anderen Liga ein anderes Team sein. Derselbe Club kann in DEL und CHL unterschiedliche Kürzel haben.

## Gleicher Club, anderes Kürzel

| Catalog-ID | Liga | Kürzel | Team | Saisons |
|---|---|---|---|---|
| `eisbaren_berlin` | DEL | **EBB** | Eisbären Berlin | 2025/26, 2026/27 |
| `eisbaren_berlin` | CHL | **BER** | Eisbären Berlin | 2025/26, 2026/27 |
| `erc_ingolstadt` | DEL | **ING** | ERC Ingolstadt | 2025/26, 2026/27 |
| `erc_ingolstadt` | CHL | **ING** | ERC Ingolstadt | 2025/26 |
| `erc_ingolstadt` | U20_DNL | **ERC** | ERC Ingolstadt U20 | 2025/26, 2026/27 |
| `esv_kaufbeuren` | DEL2 | **KAU** | ESV Kaufbeuren | 2025/26, 2026/27 |
| `esv_kaufbeuren` | U20_DNL | **ESV** | ESV Kaufbeuren U20 | 2025/26, 2026/27 |
| `kolner_haie` | DEL | **KEC** | Kölner Haie | 2025/26, 2026/27 |
| `kolner_haie` | CHL | **KOL** | Kölner Haie | 2026/27 |
| `starbulls_rosenheim` | DEL2 | **ROS** | Starbulls Rosenheim | 2025/26, 2026/27 |
| `starbulls_rosenheim` | U20_DNL | **SBR** | Starbulls Rosenheim U20 | 2025/26, 2026/27 |

Beispiel: Kölner Haie sind in der DEL **KEC**, in der CHL (ab 2026/27) **KOL**. Eisbären Berlin sind in der DEL **EBB**, in der CHL **BER**.

## Gleiches Kürzel, anderes Team

Nur die Fälle, in denen dasselbe Kürzel **nicht** denselben Club meint:

| Kürzel | Liga | Team |
|---|---|---|
| **NIT** | DEL | Nürnberg Ice Tigers |
| **NIT** | CHL | HK Nitra |
| **SCB** | CHL | SC Bern |
| **SCB** | U20_DNL | SC Bietigheim-Bissingen U20 |
| **FRA** | DEL | Löwen Frankfurt |
| **FRA** | Nationalmannschaften | Frankreich |
| **KEC** | DEL | Kölner Haie |
| **KEC** | U20_DNL | Kölner Junghaie |

U20-Nachwuchs mit gleichem Kürzel wie der Herren-Club (AEV, DRE, IEC, KEV, RAV, WOB, …) ist Absicht. Bremerhaven heißt in DEL und CHL **BRE**, aber die Catalog-ID ist unterschiedlich (`fischtown_pinguins` vs. `pinguins_bremerhaven`).

## DEL

Saisons im Katalog: 2025/26, 2026/27 (Default: 2025/26)

| Kürzel | Team | Catalog-ID | Stadt | Saisons |
|---|---|---|---|---|
| AEV | Augsburger Panther | `augsburger_panther` | Augsburg | alle |
| BRE | Fischtown Pinguins Bremerhaven | `fischtown_pinguins` | Bremerhaven | alle |
| DRE | Dresdner Eislöwen | `eislowen_dresden` | Dresden | 2025/26 |
| EBB | Eisbären Berlin | `eisbaren_berlin` | Berlin | alle |
| FRA | Löwen Frankfurt | `lowen_frankfurt` | Frankfurt | alle |
| IEC | Iserlohn Roosters | `iserlohn_roosters` | Iserlohn | alle |
| ING | ERC Ingolstadt | `erc_ingolstadt` | Ingolstadt | alle |
| KEC | Kölner Haie | `kolner_haie` | Köln | alle |
| KEV | Krefeld Pinguine | `krefeld_pinguine` | Krefeld | 2026/27 |
| MAN | Adler Mannheim | `adler_mannheim` | Mannheim | alle |
| MUC | EHC Red Bull München | `red_bull_munchen` | München | alle |
| NIT | Nürnberg Ice Tigers | `nurnberg_ice_tigers` | Nürnberg | alle |
| SEC | Schwenninger Wild Wings | `schwenninger_wild_wings` | Schwenningen | alle |
| STR | Straubing Tigers | `straubing_tigers` | Straubing | alle |
| WOB | Grizzlys Wolfsburg | `grizzlys_wolfsburg` | Wolfsburg | alle |

## DEL2

Saisons im Katalog: 2025/26, 2026/27 (Default: 2025/26)

| Kürzel | Team | Catalog-ID | Stadt | Saisons |
|---|---|---|---|---|
| BIE | Bietigheim Steelers | `bietigheim_steelers` | Bietigheim | alle |
| CRI | Eispiraten Crimmitschau | `eispiraten_crimmitschau` | Crimmitschau | alle |
| DEG | Düsseldorfer EG | `dusseldorfer_eg` | Düsseldorf | alle |
| DRE | Dresdner Eislöwen | `eislowen_dresden` | Dresden | 2026/27 |
| EVL | EV Landshut | `ev_landshut` | Landshut | alle |
| FRB | EHC Freiburg | `ehc_freiburg` | Freiburg | alle |
| KAS | EC Kassel Huskies | `ec_kassel_huskies` | Kassel | alle |
| KAU | ESV Kaufbeuren | `esv_kaufbeuren` | Kaufbeuren | alle |
| KEV | Krefeld Pinguine | `krefeld_pinguine` | Krefeld | 2025/26 |
| NAU | EC Bad Nauheim | `ec_bad_nauheim` | Bad Nauheim | alle |
| RAV | Ravensburg Towerstars | `ravensburg_towerstars` | Ravensburg | alle |
| REG | Eisbären Regensburg | `eisbaren_regensburg` | Regensburg | alle |
| ROS | Starbulls Rosenheim | `starbulls_rosenheim` | Rosenheim | alle |
| WDN | Blue Devils Weiden | `blue_devils_weiden` | Weiden | alle |
| WEI | Lausitzer Füchse | `lausitzer_fuchse` | Weißwasser | alle |

## CHL

Saisons im Katalog: 2025/26, 2026/27 (Default: 2025/26)

| Kürzel | Team | Catalog-ID | Saisons |
|---|---|---|---|
| BEL | Belfast Giants | `belfast_giants` | 2025/26 |
| BER | Eisbären Berlin | `eisbaren_berlin` | alle |
| BIF | Brynäs IF | `brynas_if` | 2025/26 |
| BOR | Bordeaux Boxers | `bordeaux_boxers` | 2026/27 |
| BRE | Pinguins Bremerhaven | `pinguins_bremerhaven` | 2025/26 |
| EVZ | EV Zug | `ev_zug` | 2025/26 |
| FHC | Frölunda Gothenburg | `frolunda_gothenburg` | alle |
| FRI | Fribourg-Gottéron | `fribourg_gotteron` | 2026/27 |
| GEN | Genève-Servette | `geneve_servette` | 2026/27 |
| GRE | Grenoble | `grenoble` | 2025/26 |
| GRZ | Graz99ers | `graz99ers` | 2026/27 |
| HBF | Herning Blue Fox | `herning_blue_fox` | 2026/27 |
| HCB | HC Bolzano | `hc_bolzano` | 2025/26 |
| HCD | HC Davos | `hc_davos` | 2026/27 |
| ILV | Ilves Tampere | `ilves_tampere` | 2025/26 |
| ING | ERC Ingolstadt | `erc_ingolstadt` | 2025/26 |
| KAC | KAC Klagenfurt | `kac_klagenfurt` | alle |
| KAL | KalPa Kuopio | `kalpa_kuopio` | 2025/26 |
| KOL | Kölner Haie | `kolner_haie` | 2026/27 |
| KOM | Kometa Brno | `kometa_brno` | 2025/26 |
| KOO | KooKoo Kouvola | `kookoo_kouvola` | 2026/27 |
| LAU | Lausanne HC | `lausanne_hc` | 2025/26 |
| LHF | Luleå Hockey | `lulea_hockey` | 2025/26 |
| LIB | Bílí Tygři Liberec | `bili_tygri_liberec` | 2026/27 |
| LUK | Lukko Rauma | `lukko_rauma` | 2025/26 |
| MAN | Adler Mannheim | `adler_mannheim` | 2026/27 |
| MHK | Mountfield HK | `mountfield_hk` | 2025/26 |
| NIT | HK Nitra | `hk_nitra` | 2026/27 |
| ODE | Odense Bulldogs | `odense_bulldogs` | 2025/26 |
| PAR | Dynamo Pardubice | `dynamo_pardubice` | 2026/27 |
| PLZ | HC Pilsen | `hc_pilsen` | 2026/27 |
| RBK | Rögle Ängelholm | `rogle_angelholm` | 2026/27 |
| RBS | Red Bull Salzburg | `red_bull_salzburg` | alle |
| SAI | SaiPa Lappeenranta | `saipa_lappeenranta` | 2026/27 |
| SCB | SC Bern | `sc_bern` | 2025/26 |
| SKE | Skellefteå AIK | `skelleftea_aik` | 2026/27 |
| SPA | Sparta Prague | `sparta_prague` | 2025/26 |
| STO | Storhamar Hamar | `storhamar_hamar` | alle |
| TAP | Tappara Tampere | `tappara_tampere` | 2026/27 |
| TYC | GKS Tychy | `gks_tychy` | alle |
| VLH | Växjö Lakers | `vaxjo_lakers` | 2026/27 |
| ZSC | ZSC Lions Zurich | `zsc_lions_zurich` | 2025/26 |

## U20_DNL

Saisons im Katalog: 2025/26, 2026/27 (Default: 2025/26)

| Kürzel | Team | Catalog-ID | Saisons |
|---|---|---|---|
| AEV | Augsburger EV U20 | `augsburger_ev` | alle |
| CHE | ESV 03 Chemnitz U20 | `esv_03_chemnitz` | alle |
| CRO | Crocodiles im FTV HH U20 | `crocodiles_im_ftv_hh` | alle |
| DEG | Düsseldorfer EG U20 | `dusseldorfer_eg` | alle |
| DRE | ESC Dresden U20 | `esc_dresden` | alle |
| DSC | Deggendorfer SC U20 | `deggendorfer_sc` | alle |
| ECP | EC Peiting U20 | `ec_peiting` | 2026/27 |
| ECT | EC Bad Tölz U20 | `ec_bad_tolz` | alle |
| EEW | ESC Eagles Essen-West U20 | `esc_eagles_essen_west` | 2025/26 |
| EHC | EHC Klostersee U20 | `ehc_klostersee` | alle |
| EJB | Eisbären Juniors Berlin | `eisbaren_juniors_berlin` | alle |
| EJK | EJ Kassel U20 | `ej_kassel` | alle |
| ERC | ERC Ingolstadt U20 | `erc_ingolstadt` | alle |
| ERF | EHC Young Dragons Erfurt U20 | `ehc_young_dragons_erfurt` | alle |
| ESV | ESV Kaufbeuren U20 | `esv_kaufbeuren` | alle |
| ESW | ES Weißwasser U20 | `es_weisswasser` | 2026/27 |
| EVD | EV Duisburg U20 | `ev_duisburg` | alle |
| EVF | EV Füssen U20 | `ev_fuessen` | alle |
| EVL | EV Landshut U20 | `ev_landshut` | alle |
| EVR | Jung-Eisbären Regensburg | `jung_eisbaren_regensburg` | alle |
| EVW | 1. EV Weiden U20 | `1_ev_weiden` | alle |
| FRA | Löwen Frankfurt U20 | `lowen_frankfurt` | 2025/26 |
| FRB | EHC Freiburg U20 | `ehc_freiburg` | alle |
| HCL | HC Landsberg Riverkings U20 | `hc_landsberg_riverkings` | alle |
| HUN | Ungarn U20 (HUN) | `hungary_u20` | alle |
| IEC | Iserlohner EC U20 | `iserlohner_ec` | alle |
| JAM | Jungadler Mannheim | `jungadler_mannheim` | alle |
| KEC | Kölner Junghaie | `kolner_junghaie` | alle |
| KEV | Krefelder EV 81 U20 | `krefelder_ev_81` | alle |
| MER | Mannheimer ERC U20 | `mannheimer_erc` | alle |
| NÜR | EHC 80 Nürnberg U20 | `ehc_80_nurnberg` | alle |
| RAV | EV Ravensburg U20 | `ev_ravensburg` | alle |
| RBM | Rookie Bulls München U20 | `rookie_bulls_munchen` | alle |
| REV | REV Bremerhaven U20 | `rev_bremerhaven` | alle |
| RTB | RT Bad Nauheim U20 | `rt_bad_nauheim` | alle |
| SBR | Starbulls Rosenheim U20 | `starbulls_rosenheim` | alle |
| SCB | SC Bietigheim-Bissingen U20 | `sc_bietigheim_bissingen` | alle |
| SCC | SCC Adler Berlin U20 | `scc_adler_berlin` | alle |
| SCR | SC Riessersee U20 | `sc_riessersee` | alle |
| SEL | VER Selb U20 | `ver_selb` | alle |
| SER | Schwenninger ERC U20 | `schwenninger_erc` | alle |
| WOB | EHC Grizzly Adams Wolfsburg U20 | `ehc_grizzly_adams_wolfsburg` | alle |

## NHL

Saisons im Katalog: 2025/26, 2026/27 (Default: 2025/26)

| Kürzel | Team | Catalog-ID | Saisons |
|---|---|---|---|
| ANA | Anaheim Ducks | `anaheim_ducks` | alle |
| BOS | Boston Bruins | `boston_bruins` | alle |
| BUF | Buffalo Sabres | `buffalo_sabres` | alle |
| CAR | Carolina Hurricanes | `carolina_hurricanes` | alle |
| CBJ | Columbus Blue Jackets | `columbus_blue_jackets` | alle |
| CGY | Calgary Flames | `calgary_flames` | alle |
| CHI | Chicago Blackhawks | `chicago_blackhawks` | alle |
| COL | Colorado Avalanche | `colorado_avalanche` | alle |
| DAL | Dallas Stars | `dallas_stars` | alle |
| DET | Detroit Red Wings | `detroit_red_wings` | alle |
| EDM | Edmonton Oilers | `edmonton_oilers` | alle |
| FLA | Florida Panthers | `florida_panthers` | alle |
| LAK | Los Angeles Kings | `los_angeles_kings` | alle |
| MIN | Minnesota Wild | `minnesota_wild` | alle |
| MTL | Montréal Canadiens | `montreal_canadiens` | alle |
| NJD | New Jersey Devils | `new_jersey_devils` | alle |
| NSH | Nashville Predators | `nashville_predators` | alle |
| NYI | New York Islanders | `new_york_islanders` | alle |
| NYR | New York Rangers | `new_york_rangers` | alle |
| OTT | Ottawa Senators | `ottawa_senators` | alle |
| PHI | Philadelphia Flyers | `philadelphia_flyers` | alle |
| PIT | Pittsburgh Penguins | `pittsburgh_penguins` | alle |
| SEA | Seattle Kraken | `seattle_kraken` | alle |
| SJS | San Jose Sharks | `san_jose_sharks` | alle |
| STL | St. Louis Blues | `st_louis_blues` | alle |
| TBL | Tampa Bay Lightning | `tampa_bay_lightning` | alle |
| TOR | Toronto Maple Leafs | `toronto_maple_leafs` | alle |
| UTA | Utah Mammoth | `utah_mammoth` | alle |
| VAN | Vancouver Canucks | `vancouver_canucks` | alle |
| VGK | Vegas Golden Knights | `vegas_golden_knights` | alle |
| WPG | Winnipeg Jets | `winnipeg_jets` | alle |
| WSH | Washington Capitals | `washington_capitals` | alle |

## Nationalmannschaften

Saisons im Katalog: 2025, 2026, 2027 (Default: 2025)

| Kürzel | Team | Catalog-ID | Saisons |
|---|---|---|---|
| AUT | Österreich | `austria` | alle |
| CAN | Kanada | `canada` | alle |
| CZE | Tschechien | `czech` | alle |
| DEN | Dänemark | `denmark` | alle |
| FIN | Finnland | `finland` | alle |
| FRA | Frankreich | `france` | alle |
| GBR | Großbritannien | `great_britain` | alle |
| GER | Deutschland | `germany` | alle |
| HUN | Ungarn | `hungary` | alle |
| ITA | Italien | `italy` | alle |
| JPN | Japan | `japan` | alle |
| KOR | Südkorea | `south_korea` | alle |
| LAT | Lettland | `latvia` | alle |
| NOR | Norwegen | `norway` | alle |
| RUS | Russland | `russia` | alle |
| SLO | Slowenien | `slovenia` | alle |
| SUI | Schweiz | `switzerland` | alle |
| SVK | Slowakei | `slovakia` | alle |
| SWE | Schweden | `sweden` | alle |
| USA | USA | `usa` | alle |

## Testspiele

Saisons im Katalog: 2025/26, 2026/27 (Default: 2026/27)

| Kürzel | Team | Catalog-ID | Stadt | Saisons |
|---|---|---|---|---|
| AEV | Augsburger Panther | `augsburger_panther` | Augsburg | alle |
| BRE | Fischtown Pinguins Bremerhaven | `fischtown_pinguins` | Bremerhaven | alle |
| DRE | Dresdner Eislöwen | `eislowen_dresden` | Dresden | 2025/26 |
| EBB | Eisbären Berlin | `eisbaren_berlin` | Berlin | alle |
| FRA | Löwen Frankfurt | `lowen_frankfurt` | Frankfurt | alle |
| GRZ | EC Graz 99ers | `ec_graz_99ers` | Graz | alle |
| HCB | HC Bolzano | `hc_bolzano` | Bolzano | alle |
| IEC | Iserlohn Roosters | `iserlohn_roosters` | Iserlohn | alle |
| ING | ERC Ingolstadt | `erc_ingolstadt` | Ingolstadt | alle |
| INN | HC TIWAG Innsbruck – Die Haie | `hc_innsbruck` | Innsbruck | alle |
| KAC | EC KAC Klagenfurt | `ec_kac_klagenfurt` | Klagenfurt | alle |
| KEC | Kölner Haie | `kolner_haie` | Köln | alle |
| KEV | Krefeld Pinguine | `krefeld_pinguine` | Krefeld | 2026/27 |
| MAN | Adler Mannheim | `adler_mannheim` | Mannheim | alle |
| MUC | EHC Red Bull München | `red_bull_munchen` | München | alle |
| NIT | Nürnberg Ice Tigers | `nurnberg_ice_tigers` | Nürnberg | alle |
| PUW | HC Pustertal | `hc_pustertal` | Bruneck | alle |
| RBS | EC Red Bull Salzburg | `ec_red_bull_salzburg` | Salzburg | alle |
| SBW | Steinbach Black Wings Linz | `steinbach_black_wings_linz` | Linz | alle |
| SCB | SC Bern | `sc_bern` | Bern | alle |
| SEC | Schwenninger Wild Wings | `schwenninger_wild_wings` | Schwenningen | alle |
| STR | Straubing Tigers | `straubing_tigers` | Straubing | alle |
| VSV | EC Villacher SV | `ec_villacher_sv` | Villach | alle |
| WOB | Grizzlys Wolfsburg | `grizzlys_wolfsburg` | Wolfsburg | alle |
| ZSC | ZSC Lions | `zsc_lions` | Zürich | alle |
| ZUG | EV Zug | `ev_zug` | Zug | alle |

