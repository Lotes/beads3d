#ifndef COLOR_H
#define COLOR_H

class Color {
public:
  int r;
  int g;
  int b;
  Color(int r, int g, int b): r(r), g(g), b(b) {}
  int rgb() const {
    return 
      ((r & 0xFF) << 16)
      | ((g & 0xFF) << 8)
      | ((b & 0xFF) << 0);
  }
};

class WeightedColor {
private:
  long red, green, blue, weight;
public:
  WeightedColor() { clear(); }
  void clear() {
    red = 0;
    green = 0;
    blue = 0;
    weight = 0;
  }
  void add(int r, int g, int b) {
    weight++;
    red += r & 0xff;
    green += g & 0xff;
    blue += b & 0xff;
  }
  bool isTransparent() const { return weight == 0; }
  int r() const { return isTransparent() ? 0 : (int) (red / weight); }
  int g() const { return isTransparent() ? 0 : (int) (green / weight); }
  int b() const { return isTransparent() ? 0 : (int) (blue / weight); }
};

#endif