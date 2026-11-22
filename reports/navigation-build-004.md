# Navigation Build 004

Development branch: `feature/universal-menu-004`, based on homepage repair `910dc6a`. No publication or DNS changes.

The homepage logo menu now follows the latest founder handoff: Store and Blog only. Both remain round controls on the logo's horizontal row. The existing sliding tracks, mouse drag behavior, native horizontal touch scrolling, keyboard navigation, Escape close, and outside-click close are retained. One destination occupies each wing.

Store retains its existing `https://1age.store/` destination; Blog retains the existing local `/experiences/blog/` experience until the independent domain is ready. The existing `?preview=commerce` route behavior is preserved. This change does not establish that the Store domain currently serves the new build.

Legacy Social/Contact/About entries were removed from this menu, following the newer two-destination direction. Their underlying data, pages, assets, and files were not deleted. The unused contact popup and asynchronous social-menu fetch were removed from the homepage controller. No globe sizing, orbit calculations, ticker, search, or planet routes were changed.

## Verification

- JavaScript syntax check passed.
- Existing orbit-layout, homepage-restoration, and touch-drag checks passed.
- Browser preview verified Store and Blog as the only logo-menu destinations, round buttons on either side of the logo, menu toggle, and Escape closure/focus return.
- Physical touchscreen input and all responsive sizes were not retested in this small menu-only build; existing responsive slider CSS is unchanged.

## World source investigation

GitHub repository search found the private `1age-world` source repository and public `1age-world-web` export repository. Code search did not find `world_build008`. Additional source trees checked at `2381648159860578cb71b0b5af7e0bcd4563d760`, `4fbede9072fe4b4eac2ea1f7855f31269327ea01`, and `dd5fff3eee3e11c113671569523751eb1aaeb0e3` also lack the later Build 008 scenes and NNB arena present in the public export. The public release commit changes only the HTML and packaged game data, not editable Godot source.

World source editing remains blocked on recovering the matching latest project. No older scene was substituted, and no private source was published. Cloudflare sign-in remains paused after the prior generic error.
