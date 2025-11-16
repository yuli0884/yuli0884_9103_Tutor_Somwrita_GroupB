# Individual-project
## 1.	How to use the work
- Hold E + click: Add a new stripe where you click.
- Space: Pause and play.
- F and S: Faster and slower.
- R: Reset everything. <br>
 The piece reacts to you. Wherever you click, new lines grow from that point.
## 2.	My animation idea
My approach focuses on making the viewer a co-creator. Each stripe grows smoothly from one end to the other, and the viewer can insert new stripes into the animation at any moment. I only allow three angles( 90°, 45°, and −45°) to keep the style clean and structured. A very thick colored line appears during the animation to hide and reveal layers, adding a rhythmic, architectural feeling to the piece.
## 3.	What drives my animation
The core driver of my animation is user input. The artwork does not rely on time, sound, or Perlin noise. Instead, everything depends on where and when the viewer clicks. Each click changes the composition and the animation sequence, meaning the outcome is always different and always shaped by the user.
## 4.	Technical explanation of how it works
I added an E + click feature by using mousePressed() and createOverlayStripeAtClick(). When the user holds E and clicks, the code creates a new stripe at the mouse position and inserts it into stripes with splice(), so it becomes part of the animation order. I also changed the stripe-generation logic so all stripes only use 90°, 45°, or −45°, instead of random angles. This is handled inside createLineGroups() and the click-based generator. I introduced background colored “eraser stripes” by giving some stripes color(bgColor), thicker stroke weights, and wider spacing. These visually cut through earlier lines. Finally, I rewrote the scaling using adjustStrokeAndScale() so stroke weights and lengths change with window size, and windowResized() regenerates

## 5.	Inspiration behind my design
This work is inspired by simple interactive drawing tools, where small inputs create surprisingly complex visuals. I also drew influence from Nasreen Mohamedi’s instruction-based art, which treats the viewer or system as part of the creative process, and from architectural line drawings, which inspired the clean geometry and limited angles. These references shaped the minimalist and rule based visual language of my animation.
everything to keep the drawing consistent.

# Reference link:

- https://www.artsy.net/artist/nasreen-mohamedi

- https://jnaf.org/exhibition/nasreen-mohamedi-the-vastness-again-again/

- https://p5js.org/reference/#Image
