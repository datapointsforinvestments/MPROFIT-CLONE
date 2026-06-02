# -*- coding: utf-8 -*-
from bs4 import BeautifulSoup
from services.screener_scraper import ScreenerScraper
s = ScreenerScraper({})

# Use actual Screener HTML with real rupee symbol
UNIT = '<span class="nowrap">₹ Cr.</span>'

cases = [
    (f'<td>Sales{UNIT}</td>', 'sales'),
    (f'<td>Power &amp; Fuel<br/>{UNIT}</td>', 'power & fuel'),
    (f'<td><a href="#">Raw Material</a>{UNIT}</td>', 'raw material'),
    (f'<td><a class="button"><i></i></a>Employee Cost{UNIT}</td>', 'employee cost'),
    (f'<td><span class="bold">Net Profit</span><span class="nowrap">₹ Cr.</span></td>', 'net profit'),
    (f'<td>Borrowings+{UNIT}</td>', 'borrowings'),
    (f'<td>Long Term Borrowings{UNIT}</td>', 'long term borrowings'),
    (f'<td>Gross Block<br/>₹ Cr.</td>', 'gross block'),
]

all_pass = True
for html, expected in cases:
    soup = BeautifulSoup(html, 'lxml')
    cell = soup.find('td')
    got = s._cell_label(cell)
    status = 'PASS' if got == expected else 'FAIL'
    if status == 'FAIL':
        all_pass = False
    print(f"{status}: expected={repr(expected)} got={repr(got)}")

print()
print('All pass!' if all_pass else 'FAILURES above.')
