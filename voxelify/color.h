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

#endif