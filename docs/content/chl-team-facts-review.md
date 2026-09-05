# CHL Team-Fakten — Review

Quelle im Code: `frontend/src/data/chlTeamFacts.ts`

Diese Infos erscheinen im Club-Popover (Session-Setup / CHL-Teamkacheln), wenn ein Team ausgewählt ist und ein zweiter Klick die Infos öffnet.

**Status:** Tabellen freigegeben (Christoph) — Detailkarten + Code daraus synchronisiert.

| Feld | Bedeutung |
|------|-----------|
| ID | Key in `chlTeamFacts` / Logo-Mapping |
| Name | Anzeigename im Popup |
| Stadt | Heimatstadt |
| Gegr. | Gründungsjahr |
| Arena | Heimspielstätte |
| Kap. | Eishockey-Kapazität |
| Liga | Nationale Liga |
| Note | Kurzer Extra-Satz unten im Popup (optional) |

## Freigabe

- [ ] Alle Einträge inhaltlich geprüft
- [ ] Arena-Namen aktuell (Sponsoring)
- [ ] Kapazitäten plausibel (Eishockey, nicht Konzert)
- [ ] Notes faktisch ok / keine Übertreibung
- [ ] Freigegeben am: _YYYY-MM-DD_

## Korrekturen (während Review)

| ID | Feld | Alt | Neu |
|----|------|-----|-----|
| eisbaren_berlin | arena | Mercedes-Benz Arena | Uber Arena *(bereits im Code)* |
|  |  |  |  |

## Alle Clubs (42)

### Deutschland

| ID | Name | Stadt | Gegr. | Arena | Kap. | Liga | Note |
|----|------|-------|-------|-------|------|------|------|
| `adler_mannheim` | Adler Mannheim | Mannheim | 1938 | SAP Arena | 13600 | DEL | — |
| `erc_ingolstadt` | ERC Ingolstadt | Ingolstadt | 1964 | Saturn Arena | 4591 | DEL | — |
| `eisbaren_berlin` | Eisbären Berlin | Berlin | 1954 | Uber Arena | 14200 | DEL | 8× DEL-Meister |
| `kolner_haie` | Kölner Haie | Köln | 1972 | LANXESS arena | 18600 | DEL | Größte Eishockeyhalle Europas |
| `pinguins_bremerhaven` | Pinguins Bremerhaven | Bremerhaven | 1974 | Eisarena Bremerhaven | 4674 | DEL | — |

### Dänemark

| ID | Name | Stadt | Gegr. | Arena | Kap. | Liga | Note |
|----|------|-------|-------|-------|------|------|------|
| `herning_blue_fox` | Herning Blue Fox | Herning | 1947 | KVIK Hockey Arena | 4105 | Metal Ligaen | - |
| `odense_bulldogs` | Odense Bulldogs | Odense | 1978 | Odense Isstadion | 3280 | Metal Ligaen | — |

### Finnland

| ID | Name | Stadt | Gegr. | Arena | Kap. | Liga | Note |
|----|------|-------|-------|-------|------|------|------|
| `ilves_tampere` | Ilves | Tampere | 1931 | Nokia Areena | 13455 | Liiga | — |
| `kalpa_kuopio` | KalPa | Kuopio | 1929 | Olvi Areena | 5300 | Liiga | — |
| `kookoo_kouvola` | KooKoo | Kouvola | 1965 | Lumon Areena| 5950 | Liiga | — |
| `lukko_rauma` | Lukko | Rauma | 1936 | Kivikylän Areena | 5400 | Liiga | — |
| `saipa_lappeenranta` | SaiPa | Lappeenranta | 1948 | Kisapuisto | 4820 | Liiga | — |
| `tappara_tampere` | Tappara | Tampere | 1932 | Nokia Areena | 13455 | Liiga | 21× Finnischer Meister — Rekordhalter |

### Frankreich

| ID | Name | Stadt | Gegr. | Arena | Kap. | Liga | Note |
|----|------|-------|-------|-------|------|------|------|
| `bordeaux_boxers` | Boxers de Bordeaux | Bordeaux | 1998 | Patinoire Mériadeck | 3312 | Ligue Magnus | — |
| `grenoble` | Grenoble Métropole Hockey 38 | Grenoble | 1963 | Patinoire Polesud | 4208 | Ligue Magnus | Rekordmeister Frankreich |

### Italien

| ID | Name | Stadt | Gegr. | Arena | Kap. | Liga | Note |
|----|------|-------|-------|-------|------|------|------|
| `hc_bolzano` | HC Bolzano | Bozen | 1933 | Sparkasse Arena | 7200 | ICE Hockey League | Ältester Hockeyclub Italiens |

### Nordirland

| ID | Name | Stadt | Gegr. | Arena | Kap. | Liga | Note |
|----|------|-------|-------|-------|------|------|------|
| `belfast_giants` | Belfast Giants | Belfast | 2000 | The O2 Belfast | 8700 | Elite Ice Hockey League | — |

### Norwegen

| ID | Name | Stadt | Gegr. | Arena | Kap. | Liga | Note |
|----|------|-------|-------|-------|------|------|------|
| `storhamar_hamar` | Storhamar Hockey | Hamar | 1957 | CC Amfi | 6091 | Elitehockeyligaen | 6× Norwegischer Meister |    

### Polen

| ID | Name | Stadt | Gegr. | Arena | Kap. | Liga | Note |
|----|------|-------|-------|-------|------|------|------|
| `gks_tychy` | GKS Tychy | Tychy | 1971 | Stadion Zimowy w Tychach | 2753 | Polska Hokej Liga | — |

### Schweden

| ID | Name | Stadt | Gegr. | Arena | Kap. | Liga | Note |
|----|------|-------|-------|-------|------|------|------|
| `brynas_if` | Brynäs IF | Gävle | 1912 | Monitor ERP Arena | 8240 | SHL | 9× Schwedischer Meister |
| `frolunda_gothenburg` | Frölunda HC | Göteborg | 1938 | Scandinavium | 12044 | SHL | 4× CHL-Champion (2016, 2017, 2019, 2020) |
| `lulea_hockey` | Luleå HF | Luleå | 1977 | Coop Norrbotten Arena | 6150 | SHL | — |
| `rogle_angelholm` | Rögle BK | Ängelholm | 1932 | Catena Arena | 6310 | SHL | CHL-Champion 2022 |
| `skelleftea_aik` | Skellefteå AIK | Skellefteå | 1921 | Skellefteå Kraft Arena | 6001 | SHL | CHL-Champion 2014 |
| `vaxjo_lakers` | Växjö Lakers | Växjö | 1997 | Vida Arena | 5750 | SHL | SHL-Meister 2015, 2018, 2021 & 2023 |

### Schweiz

| ID | Name | Stadt | Gegr. | Arena | Kap. | Liga | Note |
|----|------|-------|-------|-------|------|------|------|
| `ev_zug` | EV Zug | Zug | 1967 | OYM hall | 7450 | National League | Schweizer Meister 1998, 2021 & 2022 |
| `fribourg_gotteron` | Fribourg-Gottéron | Freiburg | 1938 | BCF Arena | 9262 | National League | — |
| `geneve_servette` | Genève-Servette HC | Genf | 1905 | Les Vernets | 7135 | National League | — |
| `hc_davos` | HC Davos | Davos | 1921 | Vaillant Arena | 6547 | National League | 31× Schweizer Meister — Rekordhalter |
| `lausanne_hc` | Lausanne HC | Lausanne | 1922 | Vaudoise aréna | 9600 | National League | — |
| `sc_bern` | SC Bern | Bern | 1931 | PostFinance Arena | 17031 | National League | Größte Eishockeyhalle der Schweiz |
| `zsc_lions_zurich` | ZSC Lions | Zürich | 1930 | Swiss Life Arena | 11157 | National League | CHL-Champion 2009 & 2024 |

### Slowakei

| ID | Name | Stadt | Gegr. | Arena | Kap. | Liga | Note |
|----|------|-------|-------|-------|------|------|------|
| `hk_nitra` | HK Nitra | Nitra | 1926 | Štadión Nitra | 3600 | Tipsport liga | — |

### Tschechien

| ID | Name | Stadt | Gegr. | Arena | Kap. | Liga | Note |
|----|------|-------|-------|-------|------|------|------|
| `bili_tygri_liberec` | Bílí Tygři Liberec | Liberec | 1956 | Home Credit Arena | 7500 | Extraliga | — |
| `dynamo_pardubice` | HC Dynamo Pardubice | Pardubice | 1925 | Enteria Arena | 10194 | Extraliga |  |
| `kometa_brno` | HC Kometa Brno | Brno | 1953 |  Winning Group Arena | 7700 | Extraliga | - |
| `sparta_prague` | HC Sparta Praha | Prag | 1909 | O2 Arena | 17360 | Extraliga | Gegründet 1909 — einer der ältesten Clubs Europas |
| `hc_pilsen` | HC Škoda Plzeň | Plzeň | 1929 | Logspeed CZ Aréna | 8211 | Extraliga | — |
| `mountfield_hk` | Mountfield HK | Hradec Králové | 1925 | ČPP Aréna | 6890 | Extraliga | — |

### Österreich

| ID | Name | Stadt | Gegr. | Arena | Kap. | Liga | Note |
|----|------|-------|-------|-------|------|------|------|
| `red_bull_salzburg` | EC Red Bull Salzburg | Salzburg | 1995 | Eisarena Salzburg | 3400 | ICE Hockey League | - |
| `kac_klagenfurt` | EC-KAC Klagenfurt | Klagenfurt | 1909 | Stadthalle | 5500 | ICE Hockey League | - |
| `graz99ers` | Graz99ers | Graz | 1999 | Eisstadion Graz-Liebenau | 4050 | ICE Hockey League | — |

## Detailkarten (Copy fürs Popup)

### Adler Mannheim (`adler_mannheim`)

- **Land:** 🇩🇪 Deutschland
- **Stadt:** Mannheim
- **Gegründet:** 1938
- **Liga:** DEL
- **Arena:** SAP Arena (13600)

### ERC Ingolstadt (`erc_ingolstadt`)

- **Land:** 🇩🇪 Deutschland
- **Stadt:** Ingolstadt
- **Gegründet:** 1964
- **Liga:** DEL
- **Arena:** Saturn Arena (4591)

### Eisbären Berlin (`eisbaren_berlin`)

- **Land:** 🇩🇪 Deutschland
- **Stadt:** Berlin
- **Gegründet:** 1954
- **Liga:** DEL
- **Arena:** Uber Arena (14200)
- **Note:** _8× DEL-Meister_

### Kölner Haie (`kolner_haie`)

- **Land:** 🇩🇪 Deutschland
- **Stadt:** Köln
- **Gegründet:** 1972
- **Liga:** DEL
- **Arena:** LANXESS arena (18600)
- **Note:** _Größte Eishockeyhalle Europas_

### Pinguins Bremerhaven (`pinguins_bremerhaven`)

- **Land:** 🇩🇪 Deutschland
- **Stadt:** Bremerhaven
- **Gegründet:** 1974
- **Liga:** DEL
- **Arena:** Eisarena Bremerhaven (4674)

### Herning Blue Fox (`herning_blue_fox`)

- **Land:** 🇩🇰 Dänemark
- **Stadt:** Herning
- **Gegründet:** 1947
- **Liga:** Metal Ligaen
- **Arena:** KVIK Hockey Arena (4105)

### Odense Bulldogs (`odense_bulldogs`)

- **Land:** 🇩🇰 Dänemark
- **Stadt:** Odense
- **Gegründet:** 1978
- **Liga:** Metal Ligaen
- **Arena:** Odense Isstadion (3280)

### Ilves (`ilves_tampere`)

- **Land:** 🇫🇮 Finnland
- **Stadt:** Tampere
- **Gegründet:** 1931
- **Liga:** Liiga
- **Arena:** Nokia Areena (13455)

### KalPa (`kalpa_kuopio`)

- **Land:** 🇫🇮 Finnland
- **Stadt:** Kuopio
- **Gegründet:** 1929
- **Liga:** Liiga
- **Arena:** Olvi Areena (5300)

### KooKoo (`kookoo_kouvola`)

- **Land:** 🇫🇮 Finnland
- **Stadt:** Kouvola
- **Gegründet:** 1965
- **Liga:** Liiga
- **Arena:** Lumon Areena (5950)

### Lukko (`lukko_rauma`)

- **Land:** 🇫🇮 Finnland
- **Stadt:** Rauma
- **Gegründet:** 1936
- **Liga:** Liiga
- **Arena:** Kivikylän Areena (5400)

### SaiPa (`saipa_lappeenranta`)

- **Land:** 🇫🇮 Finnland
- **Stadt:** Lappeenranta
- **Gegründet:** 1948
- **Liga:** Liiga
- **Arena:** Kisapuisto (4820)

### Tappara (`tappara_tampere`)

- **Land:** 🇫🇮 Finnland
- **Stadt:** Tampere
- **Gegründet:** 1932
- **Liga:** Liiga
- **Arena:** Nokia Areena (13455)
- **Note:** _21× Finnischer Meister — Rekordhalter_

### Boxers de Bordeaux (`bordeaux_boxers`)

- **Land:** 🇫🇷 Frankreich
- **Stadt:** Bordeaux
- **Gegründet:** 1998
- **Liga:** Ligue Magnus
- **Arena:** Patinoire Mériadeck (3312)

### Grenoble Métropole Hockey 38 (`grenoble`)

- **Land:** 🇫🇷 Frankreich
- **Stadt:** Grenoble
- **Gegründet:** 1963
- **Liga:** Ligue Magnus
- **Arena:** Patinoire Polesud (4208)
- **Note:** _Rekordmeister Frankreich_

### HC Bolzano (`hc_bolzano`)

- **Land:** 🇮🇹 Italien
- **Stadt:** Bozen
- **Gegründet:** 1933
- **Liga:** ICE Hockey League
- **Arena:** Sparkasse Arena (7200)
- **Note:** _Ältester Hockeyclub Italiens_

### Belfast Giants (`belfast_giants`)

- **Land:** 🇬🇧 Nordirland
- **Stadt:** Belfast
- **Gegründet:** 2000
- **Liga:** Elite Ice Hockey League
- **Arena:** The O2 Belfast (8700)

### Storhamar Hockey (`storhamar_hamar`)

- **Land:** 🇳🇴 Norwegen
- **Stadt:** Hamar
- **Gegründet:** 1957
- **Liga:** Elitehockeyligaen
- **Arena:** CC Amfi (6091)
- **Note:** _6× Norwegischer Meister_

### GKS Tychy (`gks_tychy`)

- **Land:** 🇵🇱 Polen
- **Stadt:** Tychy
- **Gegründet:** 1971
- **Liga:** Polska Hokej Liga
- **Arena:** Stadion Zimowy w Tychach (2753)

### Brynäs IF (`brynas_if`)

- **Land:** 🇸🇪 Schweden
- **Stadt:** Gävle
- **Gegründet:** 1912
- **Liga:** SHL
- **Arena:** Monitor ERP Arena (8240)
- **Note:** _9× Schwedischer Meister_

### Frölunda HC (`frolunda_gothenburg`)

- **Land:** 🇸🇪 Schweden
- **Stadt:** Göteborg
- **Gegründet:** 1938
- **Liga:** SHL
- **Arena:** Scandinavium (12044)
- **Note:** _4× CHL-Champion (2016, 2017, 2019, 2020)_

### Luleå HF (`lulea_hockey`)

- **Land:** 🇸🇪 Schweden
- **Stadt:** Luleå
- **Gegründet:** 1977
- **Liga:** SHL
- **Arena:** Coop Norrbotten Arena (6150)

### Rögle BK (`rogle_angelholm`)

- **Land:** 🇸🇪 Schweden
- **Stadt:** Ängelholm
- **Gegründet:** 1932
- **Liga:** SHL
- **Arena:** Catena Arena (6310)
- **Note:** _CHL-Champion 2022_

### Skellefteå AIK (`skelleftea_aik`)

- **Land:** 🇸🇪 Schweden
- **Stadt:** Skellefteå
- **Gegründet:** 1921
- **Liga:** SHL
- **Arena:** Skellefteå Kraft Arena (6001)
- **Note:** _CHL-Champion 2014_

### Växjö Lakers (`vaxjo_lakers`)

- **Land:** 🇸🇪 Schweden
- **Stadt:** Växjö
- **Gegründet:** 1997
- **Liga:** SHL
- **Arena:** Vida Arena (5750)
- **Note:** _SHL-Meister 2015, 2018, 2021 & 2023_

### EV Zug (`ev_zug`)

- **Land:** 🇨🇭 Schweiz
- **Stadt:** Zug
- **Gegründet:** 1967
- **Liga:** National League
- **Arena:** OYM hall (7450)
- **Note:** _Schweizer Meister 1998, 2021 & 2022_

### Fribourg-Gottéron (`fribourg_gotteron`)

- **Land:** 🇨🇭 Schweiz
- **Stadt:** Freiburg
- **Gegründet:** 1938
- **Liga:** National League
- **Arena:** BCF Arena (9262)

### Genève-Servette HC (`geneve_servette`)

- **Land:** 🇨🇭 Schweiz
- **Stadt:** Genf
- **Gegründet:** 1905
- **Liga:** National League
- **Arena:** Les Vernets (7135)

### HC Davos (`hc_davos`)

- **Land:** 🇨🇭 Schweiz
- **Stadt:** Davos
- **Gegründet:** 1921
- **Liga:** National League
- **Arena:** Vaillant Arena (6547)
- **Note:** _31× Schweizer Meister — Rekordhalter_

### Lausanne HC (`lausanne_hc`)

- **Land:** 🇨🇭 Schweiz
- **Stadt:** Lausanne
- **Gegründet:** 1922
- **Liga:** National League
- **Arena:** Vaudoise aréna (9600)

### SC Bern (`sc_bern`)

- **Land:** 🇨🇭 Schweiz
- **Stadt:** Bern
- **Gegründet:** 1931
- **Liga:** National League
- **Arena:** PostFinance Arena (17031)
- **Note:** _Größte Eishockeyhalle der Schweiz_

### ZSC Lions (`zsc_lions_zurich`)

- **Land:** 🇨🇭 Schweiz
- **Stadt:** Zürich
- **Gegründet:** 1930
- **Liga:** National League
- **Arena:** Swiss Life Arena (11157)
- **Note:** _CHL-Champion 2009 & 2024_

### HK Nitra (`hk_nitra`)

- **Land:** 🇸🇰 Slowakei
- **Stadt:** Nitra
- **Gegründet:** 1926
- **Liga:** Tipsport liga
- **Arena:** Štadión Nitra (3600)

### Bílí Tygři Liberec (`bili_tygri_liberec`)

- **Land:** 🇨🇿 Tschechien
- **Stadt:** Liberec
- **Gegründet:** 1956
- **Liga:** Extraliga
- **Arena:** Home Credit Arena (7500)

### HC Dynamo Pardubice (`dynamo_pardubice`)

- **Land:** 🇨🇿 Tschechien
- **Stadt:** Pardubice
- **Gegründet:** 1925
- **Liga:** Extraliga
- **Arena:** Enteria Arena (10194)

### HC Kometa Brno (`kometa_brno`)

- **Land:** 🇨🇿 Tschechien
- **Stadt:** Brno
- **Gegründet:** 1953
- **Liga:** Extraliga
- **Arena:** Winning Group Arena (7700)

### HC Sparta Praha (`sparta_prague`)

- **Land:** 🇨🇿 Tschechien
- **Stadt:** Prag
- **Gegründet:** 1909
- **Liga:** Extraliga
- **Arena:** O2 Arena (17360)
- **Note:** _Gegründet 1909 — einer der ältesten Clubs Europas_

### HC Škoda Plzeň (`hc_pilsen`)

- **Land:** 🇨🇿 Tschechien
- **Stadt:** Plzeň
- **Gegründet:** 1929
- **Liga:** Extraliga
- **Arena:** Logspeed CZ Aréna (8211)

### Mountfield HK (`mountfield_hk`)

- **Land:** 🇨🇿 Tschechien
- **Stadt:** Hradec Králové
- **Gegründet:** 1925
- **Liga:** Extraliga
- **Arena:** ČPP Aréna (6890)

### EC Red Bull Salzburg (`red_bull_salzburg`)

- **Land:** 🇦🇹 Österreich
- **Stadt:** Salzburg
- **Gegründet:** 1995
- **Liga:** ICE Hockey League
- **Arena:** Eisarena Salzburg (3400)

### EC-KAC Klagenfurt (`kac_klagenfurt`)

- **Land:** 🇦🇹 Österreich
- **Stadt:** Klagenfurt
- **Gegründet:** 1909
- **Liga:** ICE Hockey League
- **Arena:** Stadthalle (5500)

### Graz99ers (`graz99ers`)

- **Land:** 🇦🇹 Österreich
- **Stadt:** Graz
- **Gegründet:** 1999
- **Liga:** ICE Hockey League
- **Arena:** Eisstadion Graz-Liebenau (4050)
