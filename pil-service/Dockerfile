FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
        unzip \
        libgl1 \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 폰트 디렉토리 — Pretendard family (한글 modern sans) 5 weights
RUN mkdir -p /fonts && \
    curl -L -o /tmp/pretendard.zip \
        https://github.com/orioncactus/pretendard/releases/download/v1.3.9/Pretendard-1.3.9.zip && \
    unzip -j /tmp/pretendard.zip "public/static/Pretendard-Light.otf" -d /fonts && \
    unzip -j /tmp/pretendard.zip "public/static/Pretendard-Regular.otf" -d /fonts && \
    unzip -j /tmp/pretendard.zip "public/static/Pretendard-Medium.otf" -d /fonts && \
    unzip -j /tmp/pretendard.zip "public/static/Pretendard-Bold.otf" -d /fonts && \
    unzip -j /tmp/pretendard.zip "public/static/Pretendard-Black.otf" -d /fonts && \
    rm /tmp/pretendard.zip

# Google Fonts (OFL) — 영문 + 추가 한글 폰트
# 변수폰트 URL의 [wght]는 URL-encoded(%5Bwght%5D)되므로 -o로 출력 파일명을 지정해야 함.
# 일반 정적 폰트는 -O로 원본 파일명 유지.
RUN GF=https://github.com/google/fonts/raw/main/ofl && \
    cd /fonts && \
    # 영문 luxury serif
    curl -sL -o PlayfairDisplay-VF.ttf "${GF}/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf" && \
    curl -sL -o CormorantGaramond-VF.ttf "${GF}/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf" && \
    curl -sL -o Cinzel-VF.ttf "${GF}/cinzel/Cinzel%5Bwght%5D.ttf" && \
    curl -sLO "${GF}/abrilfatface/AbrilFatface-Regular.ttf" && \
    # 영문 editorial serif
    curl -sLO "${GF}/dmserifdisplay/DMSerifDisplay-Regular.ttf" && \
    curl -sL -o EBGaramond-VF.ttf "${GF}/ebgaramond/EBGaramond%5Bwght%5D.ttf" && \
    curl -sL -o Lora-VF.ttf "${GF}/lora/Lora%5Bwght%5D.ttf" && \
    curl -sLO "${GF}/crimsontext/CrimsonText-Regular.ttf" && \
    # 영문 modern sans
    curl -sL -o Inter-VF.ttf "${GF}/inter/Inter%5Bopsz%2Cwght%5D.ttf" && \
    curl -sL -o Manrope-VF.ttf "${GF}/manrope/Manrope%5Bwght%5D.ttf" && \
    curl -sL -o DMSans-VF.ttf "${GF}/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf" && \
    curl -sL -o PublicSans-VF.ttf "${GF}/publicsans/PublicSans%5Bwght%5D.ttf" && \
    curl -sL -o WorkSans-VF.ttf "${GF}/worksans/WorkSans%5Bwght%5D.ttf" && \
    # 영문 geometric
    curl -sL -o Montserrat-VF.ttf "${GF}/montserrat/Montserrat%5Bwght%5D.ttf" && \
    curl -sLO "${GF}/poppins/Poppins-Regular.ttf" && \
    curl -sLO "${GF}/poppins/Poppins-Bold.ttf" && \
    curl -sL -o Outfit-VF.ttf "${GF}/outfit/Outfit%5Bwght%5D.ttf" && \
    curl -sL -o PlusJakartaSans-VF.ttf "${GF}/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf" && \
    # 영문 condensed
    curl -sLO "${GF}/bebasneue/BebasNeue-Regular.ttf" && \
    curl -sLO "${GF}/anton/Anton-Regular.ttf" && \
    curl -sL -o Oswald-VF.ttf "${GF}/oswald/Oswald%5Bwght%5D.ttf" && \
    curl -sL -o BigShouldersDisplay-VF.ttf "${GF}/bigshouldersdisplay/BigShouldersDisplay%5Bwght%5D.ttf" && \
    curl -sL -o SixCaps-Regular.ttf "${GF}/sixcaps/SixCaps.ttf" && \
    # 영문 impact
    curl -sLO "${GF}/archivoblack/ArchivoBlack-Regular.ttf" && \
    curl -sLO "${GF}/blackopsone/BlackOpsOne-Regular.ttf" && \
    # 영문 script
    curl -sL -o Caveat-VF.ttf "${GF}/caveat/Caveat%5Bwght%5D.ttf" && \
    curl -sLO "${GF}/pacifico/Pacifico-Regular.ttf" && \
    curl -sL -o DancingScript-VF.ttf "${GF}/dancingscript/DancingScript%5Bwght%5D.ttf" && \
    curl -sL -o ShadowsIntoLight-Regular.ttf "${GF}/shadowsintolight/ShadowsIntoLight.ttf" && \
    # 영문 mono
    curl -sL -o JetBrainsMono-VF.ttf "${GF}/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf" && \
    curl -sLO "${GF}/ibmplexmono/IBMPlexMono-Regular.ttf" && \
    # 한글 추가 폰트
    curl -sLO "${GF}/gowunbatang/GowunBatang-Regular.ttf" && \
    curl -sLO "${GF}/gowunbatang/GowunBatang-Bold.ttf" && \
    curl -sL -o Hahmlet-VF.ttf "${GF}/hahmlet/Hahmlet%5Bwght%5D.ttf" && \
    curl -sLO "${GF}/nanummyeongjo/NanumMyeongjo-Bold.ttf" && \
    curl -sLO "${GF}/nanummyeongjo/NanumMyeongjo-ExtraBold.ttf" && \
    curl -sLO "${GF}/gowundodum/GowunDodum-Regular.ttf" && \
    curl -sLO "${GF}/sunflower/Sunflower-Medium.ttf" && \
    curl -sLO "${GF}/singleday/SingleDay-Regular.ttf" && \
    curl -sLO "${GF}/blackhansans/BlackHanSans-Regular.ttf" && \
    curl -sLO "${GF}/dohyeon/DoHyeon-Regular.ttf" && \
    curl -sLO "${GF}/jua/Jua-Regular.ttf" && \
    curl -sLO "${GF}/nanumpenscript/NanumPenScript-Regular.ttf" && \
    curl -sLO "${GF}/gaegu/Gaegu-Bold.ttf" && \
    curl -sLO "${GF}/gaegu/Gaegu-Regular.ttf" && \
    curl -sLO "${GF}/eastseadokdo/EastSeaDokdo-Regular.ttf" && \
    curl -sLO "${GF}/cutefont/CuteFont-Regular.ttf" && \
    curl -sLO "${GF}/yeonsung/YeonSung-Regular.ttf" && \
    curl -sLO "${GF}/stylish/Stylish-Regular.ttf" && \
    # URL-encoded 잔재 정리 + 빈 파일(다운로드 실패) 정리
    rm -f "*%5B"*".ttf" "*%5b"*".ttf" 2>/dev/null || true && \
    find /fonts -size -1k -delete && \
    ls /fonts | wc -l

ENV FONT_DIR=/fonts

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
