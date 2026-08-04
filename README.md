# The Seminyak Beach Resort link page

This is a lightweight, mobile-friendly link page designed for GitHub Pages.

## Update the content

Edit `content.json` directly in GitHub and commit the change.

- Use `"visible": false` to hide a social link, section, or card.
- Use `"showImage": true` to show a card image.
- Use `"showImage": false` to display the card without a picture.
- Use `"carousel": true` on a section for a horizontal swipe carousel.
- Use `"carousel": false` on a section for the normal vertical card list.
- Use `"action": "link"` on a card to open its `url`.
- Use `"action": "popup"` on a card to open only `popupImage` in a lightbox.
- Change the order of items in the JSON to change their order on the page.
- Put new images in the `images` folder and set `"image"` to their relative path.

### Background controls

The `background` section in `content.json` controls the page photograph:

- `"showImage": false` hides the background photograph.
- `"imageOpacity"` accepts `0` to `1`. Lower values make the photograph fainter.
- `"overlayOpacity"` accepts `0` to `1`. Higher values add a stronger dark fade.
- `"position"` adjusts the crop, such as `"center center"` or `"center top"`.
- `"blur"` controls softening from `0` to `12`.

Example:

```json
{
  "title": "Guest Activities",
  "action": "link",
  "description": "Explore our daily resort experiences.",
  "url": "https://example.com",
  "image": "images/activities.jpg",
  "showImage": true,
  "visible": true
}
```

Popup example:

```json
{
  "title": "Taste of Bali",
  "action": "popup",
  "image": "images/taste-of-bali.jpg",
  "showImage": true,
  "popupImage": "images/taste-of-bali-large.jpg",
  "popupAlt": "Taste of Bali cultural dinner performance",
  "visible": true
}
```

## Publish with GitHub Pages

1. Create a GitHub repository and upload this project.
2. Use `main` as the default branch.
3. Open **Settings → Pages** in the repository.
4. Under **Build and deployment**, select **GitHub Actions** as the source.
5. Push a change or run the **Deploy to GitHub Pages** workflow manually.

The page has no top navigation/shop switcher and no footer.
