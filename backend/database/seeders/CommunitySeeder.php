<?php

namespace Database\Seeders;

use App\Models\Community;
use Illuminate\Database\Seeder;

class CommunitySeeder extends Seeder
{
    /**
     * デフォルトの yui コミュニティ（Polygon Amoy テストネット）
     */
    public function run(): void
    {
        Community::firstOrCreate(
            ['slug' => 'yui-default'],
            [
                'name' => 'yui パーマカルチャー教室',
                'token_name' => 'Yui Token',
                'token_symbol' => 'YUI',
                'contract_address' => '0x414e5d24208c394210A1D61D78b2C42125f7f796',
                'sbt_contract_address' => '0x23177541Ce02EE55794523a68616BB9041590e15',
                'demurrage_rate' => 0,
            ]
        );
    }
}
