#include <iostream>
#include <FreeImage.h>

using namespace std;

int main(int argc, char *argv[]) {
	if(argc < 3) {
		cout << "Usage: tga2png <tga file> <png file>" << endl;
		return 1;
	}

	char* inputFileName = argv[1];
	char* outputFileName = argv[2];
	FIBITMAP *hTarga = FreeImage_Load(FIF_TARGA, inputFileName, 0);
  if (hTarga) {
    FIBITMAP* hPNG = FreeImage_ColorQuantize(hTarga, FIQ_WUQUANT);
    FreeImage_Save(FIF_PNG, hPNG, outputFileName, 0);
    FreeImage_Unload(hPNG);
    FreeImage_Unload(hTarga);
  }
  return 0;
}