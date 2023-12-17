#!/bin/bash -e

# https://gist.github.com/roblabs/527458cbe46b0483cd2d594c7b9e583f

# Recommended source_image size 1024x1024

source_image=$1
output_dir=$2

unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     machine=Linux;;
    Darwin*)    machine=Mac;;
    CYGWIN*)    machine=Cygwin;;
    MINGW*)     machine=MinGw;;
    MSYS_NT*)   machine=Git;;
    *)          machine="UNKNOWN:${unameOut}"
esac

if [[ $machine == "Mac" ]]
then
 HOMEBREW_NO_AUTO_UPDATE=1 arch -arm64 brew list imagemagick &>/dev/null || arch -arm64 brew install imagemagick
fi


command -v convert >/dev/null 2>&1 || {
    echo >&2 "I require imagemagick but it's not installed.  Aborting."
    exit 1
}

icon_path="$output_dir/res"

mkdir -p $icon_path
rm -rf $icon_path/*.png

declare -a variations=(
    "36x36:mipmap-ldpi"
    "48x48:mipmap-mdpi"
    "72x72:mipmap-hdpi"
    "96x96:mipmap-xhdpi"
    "144x144:mipmap-xxhdpi"
    "192x192:mipmap-xxxhdpi"
)

function generateImage {
    mkdir -p $icon_path/$2
    convert $source_image -resize $1 -gravity center "$icon_path/$2/ic_launcher.png"
 
    W=$(echo $1 | cut -d'x' -f1) # ref: https://stackoverflow.com/a/18992215/19125264
    convert -size $1 xc:none -draw "roundrectangle 0,0,$W,$W,$(($W/2)),$(($W/2))" "$icon_path/$2/mask.png"
    convert "$icon_path/$2/ic_launcher.png" -matte "$icon_path/$2/mask.png" -compose DstIn -composite "$icon_path/$2/ic_launcher_round.png"
    rm "$icon_path/$2/mask.png"
}

function generateImages {
    for size in "${variations[@]}"; do
        generateImage $(echo $size | tr : " ")
    done
}

generateImages
